import { scrapAll } from '@lotto-tracker/scrapper';

export async function GET() {
  try {
    await scrapAll();
    return Response.json({ message: 'Scraping completed successfully' });
  } catch (error) {
    console.log({ message: 'Scrapping failed:' + JSON.stringify(error) });
    return Response.json(
      { message: 'Scrapping failed:' + JSON.stringify(error) },
      { status: 500 },
    );
  }
}
