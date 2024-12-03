import { TZDate } from '@date-fns/tz';
import { lotto, LottoId, lottoResult } from '@lotto-tracker/drizzle';
import { endOfYear, isSameDay } from 'date-fns';
import puppeteer from 'puppeteer';
import { tabletojson } from 'tabletojson';
import { db } from '../../drizzle/lib/db';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapAll() {
  const lottosLastCrawled = new Map<
    LottoId,
    { lastCrawledAt: Date | null; pcsoId: typeof lotto.$inferSelect.pcsoId }
  >();

  // TODO: Query for each LottoId, get LastCrawled;
  lottosLastCrawled.set('PCSO_6_42', { lastCrawledAt: null, pcsoId: '13' });
  lottosLastCrawled.set('PCSO_6_49', { lastCrawledAt: null, pcsoId: '1' });
  lottosLastCrawled.set('PCSO_6_45', { lastCrawledAt: null, pcsoId: '2' });
  lottosLastCrawled.set('PCSO_6_58', { lastCrawledAt: null, pcsoId: '18' });
  lottosLastCrawled.set('PCSO_6_55', { lastCrawledAt: null, pcsoId: '17' });

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Set screen size.
  await page.setViewport({ width: 1900, height: 1080 });

  const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long' });
  const yearFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric' });

  for (const lottoId of lottosLastCrawled.keys()) {
    const _lotto = lottosLastCrawled.get(lottoId);
    if (!_lotto) {
      console.log(`cannot determine pcsoId for ${lottoId}....`);
      continue;
    }
    const pcsoId = _lotto.pcsoId;
    let lastCrawledAt = _lotto.lastCrawledAt;

    const phDate = TZDate.tz('Asia/Manila');
    if (lastCrawledAt && isSameDay(lastCrawledAt, phDate)) {
      console.log(`${lottoId} already crawled for today. skipping...`);
      continue;
    }

    let currYear = lastCrawledAt ? lastCrawledAt.getFullYear() : 2014;
    let forceStop = false;
    while (currYear <= phDate.getFullYear() && !forceStop) {
      console.log(`> will scrap ${currYear}...`);
      const fromDate = new Date(currYear, 0, 1);
      const yearLastDay = endOfYear(fromDate);
      const fromMonth = monthFormat.format(fromDate);
      const fromDay = fromDate.getDate().toString();
      const fromYear = yearFormat.format(fromDate).toString();
      const toMonth = monthFormat.format(yearLastDay);
      const toDay = yearLastDay.getDate().toString();
      const toYear = yearFormat.format(yearLastDay).toString();

      const resultFileName = `/Users/arvil/Projects/lotto-tracker/results/${lottoId}/${fromYear}-${fromMonth}-${fromDay}_${toYear}-${toMonth}-${toDay}.json`;

      if (await Bun.file(resultFileName).exists()) {
        console.log(
          `${lottoId} at ${currYear} was already crawled, skipping...`,
        );
        currYear = currYear + 1;
        continue;
      }

      // Go
      await page.goto(
        atob(
          'aHR0cHM6Ly93d3cucGNzby5nb3YucGgvU2VhcmNoTG90dG9SZXN1bHQuYXNweA==',
        ), // because SEO
      );

      await page.waitForSelector('div.pre-con', { hidden: true });

      await page
        .locator(
          '#search-lotto table#cphContainer_cpContent_GridView1 tbody > tr:nth-child(2)',
        )
        .waitHandle();

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

      // lotto game
      await lottoGame.select(pcsoId);

      // from
      console.log(`selecting FROM:`);
      console.log(`> from month: ${fromMonth}`);
      console.log(`> from day: ${fromDay}`);
      console.log(`> from year: ${fromYear}`);
      await startMonth.select(fromMonth);
      await startDay.select(fromDay);
      await startYear.select(fromYear);

      // to
      console.log(`selecting To:`);
      console.log(`> to month: ${toMonth}`);
      console.log(`> to day: ${toDay}`);
      console.log(`> to year: ${toYear}`);
      await endMonth.select(toMonth);
      await endDay.select(toDay);
      await endYear.select(toYear);
      await sleep(250);

      await page.focus('#search-lotto #cphContainer_cpContent_btnSearch');
      console.log(`clicking submit...`);
      await page.screenshot({
        path:
          '/Users/arvil/Projects/lotto-tracker/screenshots/' +
          new Date().getMilliseconds().toString() +
          '.jpg',
      });
      await page
        .locator('#search-lotto #cphContainer_cpContent_btnSearch')
        .click();
      console.log(`clicked`);

      try {
        await page.waitForNavigation({ timeout: 7_000 });
        await page.waitForSelector('div.pre-con', {
          hidden: true,
          timeout: 7_000,
        });
      } catch (_error) {
        console.log(`failed to crawl: ${lottoId} at ${currYear}`, _error);
        currYear = currYear + 1;
        continue;
      }
      await sleep(1000);

      try {
        await page
          .locator(
            '#search-lotto table#cphContainer_cpContent_GridView1 tbody > tr:nth-child(2)',
          )
          .setTimeout(7_000)
          .waitHandle();
      } catch (error) {
        console.log(`Search result not found for ${lottoId} : ${currYear}`);
        currYear = currYear + 1;
        console.log(error);
        continue;
      }

      const table = await page
        .locator('#search-lotto table#cphContainer_cpContent_GridView1')
        .waitHandle();
      const tableHtml = await table.evaluate((el) => el.outerHTML);

      const tablesAsJson = tabletojson.convert(tableHtml);

      const results: {
        'LOTTO GAME': string;
        COMBINATIONS: string;
        'DRAW DATE': string;
        'JACKPOT (PHP)': string;
        WINNERS: string;
      }[] = tablesAsJson[0];

      await Bun.write(resultFileName, JSON.stringify(results));

      const lastResult = results[results.length - 1];
      if (!lastResult) {
        console.log(`> Cannot determine the last result, force stopping...`);
        forceStop = true;
        continue;
      }
      const drawDate = (
        (lastResult['DRAW DATE'] satisfies string).split('/') as string[]
      ).map((n) => parseInt(n));
      lastCrawledAt = new TZDate(
        drawDate[2],
        drawDate[0] - 1,
        drawDate[1],
        'Asia/Manila',
      );
      currYear = currYear + 1;

      await db
        .insert(lottoResult)
        .values(
          results.map((node) => {
            const _drawDate = (
              (node['DRAW DATE'] satisfies string).split('/') as string[]
            ).map((n) => parseInt(n));
            const drawAt = new TZDate(
              _drawDate[2],
              _drawDate[0] - 1,
              _drawDate[1],
              'Asia/Manila',
            );
            return {
              lottoId,
              result: (
                (node['COMBINATIONS'] satisfies string).split('-') as string[]
              ).map((n) => parseInt(n)),
              drawAt,
              winners: parseInt(node['WINNERS']),
              jackpotPrize: parseInt(node['JACKPOT (PHP)'].replace(/,/g, '')),
            };
          }),
        )
        .onConflictDoNothing();

      await sleep(3_000);
    }
  }
}
