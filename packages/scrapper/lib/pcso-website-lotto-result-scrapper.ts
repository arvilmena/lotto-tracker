import { TZDate } from '@date-fns/tz';
import { LOTTO_IDS, LottoId, PHILIPPINES_TIMEZONE } from '@lotto-tracker/base';
import { lotto } from '@lotto-tracker/drizzle';
import { getLastCrawledAt } from '@lotto-tracker/repositories';
import { endOfYear, isSameDay, startOfDay, subDays } from 'date-fns';
import puppeteer, { Browser, Page } from 'puppeteer';
import { tabletojson } from 'tabletojson';
import {
  parseLottoRowResults,
  rawLottoRowResultSchema,
} from './helpers/parseLottoRowResults';
import { saveLottoResults } from './helpers/saveLottoResults';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type CrawlParams = {
  pcsoId: string;
  fromDate: Date;
  toDate: Date;
};

async function crawlLottoResults(
  page: Page,
  params: CrawlParams,
): Promise<string> {
  const { pcsoId, fromDate, toDate } = params;
  const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long' });
  const yearFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric' });

  try {
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
    await page
      .locator('#search-lotto #cphContainer_cpContent_btnSearch')
      .click();

    await page.waitForNavigation({ timeout: 7_000 });
    await page.waitForSelector('div.pre-con', { hidden: true, timeout: 7_000 });
    await sleep(1000);

    // Get results table
    const table = await page
      .locator('#search-lotto table#cphContainer_cpContent_GridView1')
      .waitHandle();

    return await table.evaluate((el) => el.outerHTML);
  } catch (error) {
    console.error(JSON.stringify(error));
    throw error;
  }
}

function convertTableToJson(tableHtml: string) {
  const tablesAsJson = tabletojson.convert(tableHtml);
  return rawLottoRowResultSchema.array().parse(tablesAsJson[0]);
}

async function getAllLottoLastCrawledAtAndPcsoId() {
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
  console.log('starting scrapAll()...');
  const lottosLastCrawled = await getAllLottoLastCrawledAtAndPcsoId();

  let browser: Browser;
  try {
    browser = await puppeteer.launch({ headless: true });
  } catch (error) {
    console.error('Error launching browser:', JSON.stringify(error));
    throw error;
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1900, height: 1080 });

  try {
    for (const [lottoId, lottoData] of lottosLastCrawled) {
      const phDate = TZDate.tz(PHILIPPINES_TIMEZONE);
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
        let toDate =
          currYear < phDate.getFullYear()
            ? endOfYear(fromDate)
            : phDate.getHours() > 9 // too early to crawl, wait atleast 9am
              ? phDate
              : startOfDay(subDays(phDate, 1));

        // If toDate is greater than phDate, set it to phDate
        // This is to prevent submitting a date that is greater than the current date
        toDate = toDate.getTime() > phDate.getTime() ? phDate : toDate;

        console.log(`crawling... ${lottoId}`, {
          pcsoId: lottoData.pcsoId,
          fromDate,
          toDate,
        });

        try {
          const tableHtml = await crawlLottoResults(page, {
            pcsoId: lottoData.pcsoId,
            fromDate,
            toDate,
          });

          const results = parseLottoRowResults(convertTableToJson(tableHtml));
          await saveLottoResults(results);

          await sleep(3_000);
        } catch (error) {
          console.error(
            `Error processing ${lottoId} for ${currYear}:`,
            JSON.stringify(error),
          );
        }

        currYear++;
      }
    }
  } finally {
    await browser.close();
  }

  console.log('scrapAll() completed');
}
