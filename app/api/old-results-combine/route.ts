import { combineOldResults } from '@lotto-tracker/scrapper';

export async function GET() {
  try {
    const results = await combineOldResults();
    return Response.json({
      message: `Successfully combined ${results.length} old results`,
    });
  } catch (error) {
    console.error('Failed to combine old results:', error);
    return Response.json(
      { message: 'Failed to combine old results' },
      { status: 500 },
    );
  }
}
