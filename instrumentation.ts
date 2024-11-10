import cron from 'node-cron';

export function register() {
  console.log('register from instrumentation.ts registered');

  cron.schedule('* * * * *', () => {
    console.log('running a task every minute');
  });
}
