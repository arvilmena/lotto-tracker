import { TZDate } from '@date-fns/tz';
import {
  LOTTO_IDS,
  LottoId,
  PCSO_6_42_LOTTO_GAME_ID,
  PCSO_6_45_LOTTO_GAME_ID,
  PCSO_6_49_LOTTO_GAME_ID,
  PCSO_6_55_LOTTO_GAME_ID,
  PCSO_6_58_LOTTO_GAME_ID,
} from '@lotto-tracker/base';
import { lotto } from '@lotto-tracker/drizzle';
import {
  dbInsertLottoResult,
  getLastCrawledAt,
} from '@lotto-tracker/repositories';
import { endOfYear, isSameDay } from 'date-fns';
import pLimit from 'p-limit';
import puppeteer, { Page } from 'puppeteer';
import { tabletojson } from 'tabletojson';
import { z } from 'zod';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface LottoSearchResult {
  lottoGame: LottoId;
  combinations: number[];
  drawDate: TZDate;
  jackpotPrize: number;
  winners: number;
}

interface CrawlParams {
  pcsoId: string;
  fromDate: Date;
  toDate: Date;
}

async function crawlLottoResults(
  page: Page,
  params: CrawlParams,
): Promise<string> {
  const { pcsoId, fromDate, toDate } = params;
  const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long' });
  const yearFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric' });

  await page.goto(
    atob('aHR0cHM6Ly93d3cucGNzby5nb3YucGgvU2VhcmNoTG90dG9SZXN1bHQuYXNweA=='),
  );

  await page.waitForSelector('div.pre-con', { hidden: true });
  await page
    .locator(
      '#search-lotto table#cphContainer_cpContent_GridView1 tbody > tr:nth-child(2)',
    )
    .waitHandle();

  // Get form elements
  const lottoGame = await page
    .locator('#search-lotto select#cphContainer_cpContent_ddlSelectGame')
    .waitHandle();
  const startMonth = await page
    .locator('#search-lotto select#cphContainer_cpContent_ddlStartMonth')
    .waitHandle();
  const startDay = await page
    .locator('#search-lotto select#cphContainer_cpContent_ddlStartDate')
    .waitHandle();
  const startYear = await page
    .locator('#search-lotto select#cphContainer_cpContent_ddlStartYear')
    .waitHandle();
  const endMonth = await page
    .locator('#search-lotto select#cphContainer_cpContent_ddlEndMonth')
    .waitHandle();
  const endDay = await page
    .locator('#search-lotto select#cphContainer_cpContent_ddlEndDay')
    .waitHandle();
  const endYear = await page
    .locator('#search-lotto select#cphContainer_cpContent_ddlEndYear')
    .waitHandle();

  // Fill form
  await lottoGame.select(pcsoId);
  await startMonth.select(monthFormat.format(fromDate));
  await startDay.select(fromDate.getDate().toString());
  await startYear.select(yearFormat.format(fromDate));
  await endMonth.select(monthFormat.format(toDate));
  await endDay.select(toDate.getDate().toString());
  await endYear.select(yearFormat.format(toDate));

  await sleep(250);

  // Submit and wait for results
  await page.focus('#search-lotto #cphContainer_cpContent_btnSearch');
  await page.locator('#search-lotto #cphContainer_cpContent_btnSearch').click();

  await page.waitForNavigation({ timeout: 7_000 });
  await page.waitForSelector('div.pre-con', { hidden: true, timeout: 7_000 });
  await sleep(1000);

  // Get results table
  const table = await page
    .locator('#search-lotto table#cphContainer_cpContent_GridView1')
    .waitHandle();

  return await table.evaluate((el) => el.outerHTML);
}

const rawLottoResultSchema = z.object({
  'LOTTO GAME': z.string(),
  COMBINATIONS: z.string(),
  'DRAW DATE': z.string(),
  'JACKPOT (PHP)': z.string(),
  WINNERS: z.string(),
});

function parseLottoResults(tableHtml: string): LottoSearchResult[] {
  const tablesAsJson = tabletojson.convert(tableHtml);
  const rawResults = rawLottoResultSchema.array().parse(tablesAsJson[0]);

  return rawResults.map((result) => {
    const drawDate = result['DRAW DATE'].split('/').map((n) => parseInt(n));
    if (drawDate.length !== 3) {
      throw new Error(`Invalid draw date format: ${result['DRAW DATE']}`);
    }

    const combinations = result['COMBINATIONS']
      .split('-')
      .map((n) => parseInt(n));

    const lottoId = determineLottoId(result['LOTTO GAME']);
    if (!lottoId) {
      throw new Error(`Unsupported lotto game: ${result['LOTTO GAME']}`);
    }

    return {
      lottoGame: lottoId,
      combinations,
      drawDate: new TZDate(
        drawDate[2] ?? 0,
        (drawDate[0] ?? 1) - 1,
        drawDate[1] ?? 1,
        'Asia/Manila',
      ),
      winners: parseInt(result['WINNERS']),
      jackpotPrize: parseInt(result['JACKPOT (PHP)'].replace(/,/g, '')),
    };
  });
}

async function saveLottoResults(results: LottoSearchResult[]): Promise<void> {
  const saveLimit = pLimit(3);

  await Promise.all(
    results.map((result) =>
      saveLimit(() =>
        dbInsertLottoResult({
          lottoId: result.lottoGame,
          result: result.combinations,
          drawAt: result.drawDate,
          winners: result.winners,
          jackpotPrize: result.jackpotPrize,
        }),
      ),
    ),
  );
}

// Helper function to determine lotto ID
function determineLottoId(lottoGame: string): LottoId | null {
  if (lottoGame.includes('6/42')) return PCSO_6_42_LOTTO_GAME_ID;
  if (lottoGame.includes('6/45')) return PCSO_6_45_LOTTO_GAME_ID;
  if (lottoGame.includes('6/49')) return PCSO_6_49_LOTTO_GAME_ID;
  if (lottoGame.includes('6/55')) return PCSO_6_55_LOTTO_GAME_ID;
  if (lottoGame.includes('6/58')) return PCSO_6_58_LOTTO_GAME_ID;
  return null;
}

async function initializeLottoCrawlState() {
  const lottosLastCrawled = new Map<
    LottoId,
    { lastCrawledAt: Date; pcsoId: typeof lotto.$inferSelect.pcsoId }
  >();

  for (const lottoId of LOTTO_IDS) {
    const lastCrawled = await getLastCrawledAt(lottoId);
    if (!lastCrawled) {
      throw new Error(
        `Cannot determine the last crawled data for lotto: ${lottoId}`,
      );
    }
    lottosLastCrawled.set(lottoId, {
      lastCrawledAt: lastCrawled.lotto_result.drawAt,
      pcsoId: lastCrawled.lotto.pcsoId,
    });
  }
  return lottosLastCrawled;
}

// Main function
export async function scrapAll() {
  const lottosLastCrawled = await initializeLottoCrawlState();
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1900, height: 1080 });

  try {
    for (const [lottoId, lottoData] of lottosLastCrawled) {
      const phDate = TZDate.tz('Asia/Manila');
      if (isSameDay(lottoData.lastCrawledAt, phDate)) {
        console.log(`${lottoId} already crawled for today. skipping...`);
        continue;
      }

      let currYear = lottoData.lastCrawledAt.getFullYear();
      while (currYear <= phDate.getFullYear()) {
        const fromDate = new Date(
          currYear,
          Math.max(lottoData.lastCrawledAt.getMonth() - 2, 0),
          1,
        );
        const toDate = endOfYear(fromDate);

        try {
          const tableHtml = await crawlLottoResults(page, {
            pcsoId: lottoData.pcsoId,
            fromDate,
            toDate,
          });

          const results = parseLottoResults(tableHtml);
          await saveLottoResults(results);

          await sleep(3_000);
        } catch (error) {
          console.error(`Error processing ${lottoId} for ${currYear}:`, error);
        }

        currYear++;
      }
    }
  } finally {
    await browser.close();
  }
}
