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
import puppeteer from 'puppeteer';
import { tabletojson } from 'tabletojson';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapAll() {
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

    let currYear = lastCrawledAt ? lastCrawledAt.getFullYear() : 2024;
    let forceStop = false;
    while (currYear <= phDate.getFullYear() && !forceStop) {
      console.log(`> will scrap ${currYear}...`);
      const fromDate = new Date(
        currYear,
        Math.max(lastCrawledAt.getMonth() - 2, 0),
        1,
      );
      const yearLastDay = endOfYear(fromDate);
      const fromMonth = monthFormat.format(fromDate);
      const fromDay = fromDate.getDate().toString();
      const fromYear = yearFormat.format(fromDate).toString();
      const toMonth = monthFormat.format(yearLastDay);
      const toDay = yearLastDay.getDate().toString();
      const toYear = yearFormat.format(yearLastDay).toString();

      // const resultFileName = `/Users/arvil/Projects/lotto-tracker/results/${lottoId}/${fromYear}-${fromMonth}-${fromDay}_${toYear}-${toMonth}-${toDay}.json`;
      // if (await Bun.file(resultFileName).exists()) {
      //   console.log(
      //     `${lottoId} at ${currYear} was already crawled, skipping...`,
      //   );
      //   currYear = currYear + 1;
      //   continue;
      // }

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
      // await page.screenshot({
      //   path:
      //     '/Users/arvil/Projects/lotto-tracker/screenshots/' +
      //     new Date().getMilliseconds().toString() +
      //     '.jpg',
      // });
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

      // await Bun.write(resultFileName, JSON.stringify(results));

      const lastResult = results[results.length - 1];
      if (!lastResult) {
        console.log(`> Cannot determine the last result, force stopping...`);
        forceStop = true;
        continue;
      }

      const _lottoId = lastResult['LOTTO GAME'].includes('6/42')
        ? PCSO_6_42_LOTTO_GAME_ID
        : lastResult['LOTTO GAME'].includes('6/45')
          ? PCSO_6_45_LOTTO_GAME_ID
          : lastResult['LOTTO GAME'].includes('6/49')
            ? PCSO_6_49_LOTTO_GAME_ID
            : lastResult['LOTTO GAME'].includes('6/55')
              ? PCSO_6_55_LOTTO_GAME_ID
              : lastResult['LOTTO GAME'].includes('6/58')
                ? PCSO_6_58_LOTTO_GAME_ID
                : null;
      if (!_lottoId) {
        throw new Error(
          `Lotto game for ${lastResult['LOTTO GAME']} is not supported in the database`,
        );
      }
      const drawDate = (
        (lastResult['DRAW DATE'] satisfies string).split('/') as string[]
      ).map((n) => parseInt(n));
      if (drawDate.length !== 3) {
        console.log(
          `> Draw Date ${lastResult['DRAW DATE']} should only contain 2 slashes, force stopping...`,
        );
        forceStop = true;
        continue;
      }
      if (
        drawDate.length < 3 ||
        drawDate[2] === undefined ||
        drawDate[0] === undefined ||
        drawDate[1] === undefined
      ) {
        console.log(
          `> Cannot parse Draw Date for ${lastResult['DRAW DATE']}, force stopping...`,
        );
        forceStop = true;
        continue;
      }
      lastCrawledAt = new TZDate(
        drawDate[2],
        drawDate[0] - 1,
        drawDate[1],
        'Asia/Manila',
      );
      currYear = currYear + 1;

      const saveLimit = pLimit(3);

      await Promise.all(
        results.map(async (result) =>
          saveLimit(async () => {
            const _drawDate = (
              (result['DRAW DATE'] satisfies string).split('/') as string[]
            ).map((n) => parseInt(n));
            if (
              _drawDate.length < 3 ||
              _drawDate[2] === undefined ||
              _drawDate[0] === undefined ||
              _drawDate[1] === undefined
            ) {
              throw new Error(
                `> Cannot parse Draw Date for ${result['DRAW DATE']}, force stopping...`,
              );
            }
            const drawAt = new TZDate(
              _drawDate[2],
              _drawDate[0] - 1,
              _drawDate[1],
              'Asia/Manila',
            );
            const resultCombinations = (
              (result['COMBINATIONS'] satisfies string).split('-') as string[]
            ).map((n) => parseInt(n));
            await dbInsertLottoResult({
              lottoId: _lottoId,
              result: resultCombinations,
              drawAt,
              winners: parseInt(result['WINNERS']),
              jackpotPrize: parseInt(result['JACKPOT (PHP)'].replace(/,/g, '')),
            });
          }),
        ),
      );

      await sleep(3_000);
    }
  }
  browser.close();
}
