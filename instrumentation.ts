import cron from 'node-cron';
import { scrapAll } from './packages/scrapper/lib/pcso-website-lotto-result-scrapper';

export function register() {
  console.log('register from instrumentation.ts registered');

  cron.schedule('* * * * *', () => {
    console.log('running a task every minute');
  });

  // run every 30th minute
  cron.schedule('*/30 * * * *', async () => {
    console.log('running a task every 30th minute of the hour');

    await scrapAll();
  });
}
