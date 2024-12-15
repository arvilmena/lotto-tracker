import { scrapAll } from '@lotto-tracker/scrapper';

export async function GET() {
  await scrapAll();
  return Response.json({ message: 'Scraping completed successfully' });
}
