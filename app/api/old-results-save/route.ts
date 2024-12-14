import { saveOldResultsToDb } from '@lotto-tracker/scrapper';

export async function GET() {
  try {
    const results = await saveOldResultsToDb();
    return Response.json({
      message: `Successfully saved ${results} old results to database`,
    });
  } catch (error) {
    console.error('Failed to save old results to database:', error);
    return Response.json(
      { message: 'Failed to save old results to database' },
      { status: 500 },
    );
  }
}
