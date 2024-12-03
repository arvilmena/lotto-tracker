import { scrapAll } from '@lotto-tracker/scrapper';

async function serverScrapAll() {
  'use server';
  await scrapAll();
}

export async function GET() {
  await serverScrapAll();
  return new Response('Hello, from API!');
}
