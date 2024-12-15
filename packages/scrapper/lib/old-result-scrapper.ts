import { MY_CONFIG } from '@lotto-tracker/config';
import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  parseLottoRowResults,
  RawLottoRowResult,
  rawLottoRowResultSchema,
} from './helpers/parseLottoRowResults';
import { saveLottoResults } from './helpers/saveLottoResults';

async function crawlJsonFiles(directory: string): Promise<RawLottoRowResult[]> {
  const allEntries: RawLottoRowResult[] = [];

  async function processDirectory(currentPath: string) {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await processDirectory(fullPath);
        continue;
      }

      if (entry.isFile() && path.extname(fullPath) === '.json') {
        try {
          const content = await readFile(fullPath, 'utf-8');
          const jsonData = JSON.parse(content);

          // Ensure we're working with an array of lottery entries
          if (Array.isArray(jsonData)) {
            // Validate each entry has the expected structure
            const validEntries = jsonData.filter(
              (item): item is RawLottoRowResult => {
                return (
                  typeof item === 'object' &&
                  item !== null &&
                  'LOTTO GAME' in item &&
                  'COMBINATIONS' in item &&
                  'DRAW DATE' in item &&
                  'JACKPOT (PHP)' in item &&
                  'WINNERS' in item
                );
              },
            );

            allEntries.push(...validEntries);
          }
        } catch (error) {
          console.error(`Error processing ${fullPath}:`, error);
        }
      }
    }
  }

  await processDirectory(directory);
  return allEntries;
}

const resultsPath = path.resolve(MY_CONFIG.ROOT_PATH, 'results');

async function combineOldResults() {
  try {
    const outputPath = path.resolve(resultsPath, 'old-results.json');

    console.log('Starting to crawl JSON files...');
    const allEntries = (await crawlJsonFiles(resultsPath)).sort((a, b) =>
      a['DRAW DATE'].localeCompare(b['DRAW DATE']),
    );

    console.log(`Found ${allEntries.length} valid lottery entries`);

    await writeFile(outputPath, JSON.stringify(allEntries), 'utf-8');

    console.log(`Successfully saved combined results to ${outputPath}`);
    return allEntries;
  } catch (error) {
    console.error('Error combining results:', error);
    throw error;
  }
}

async function saveOldResultsToDb(): Promise<number> {
  let savedCount = 0;
  try {
    console.log('Starting to process old results...');

    // Read the JSON file
    const oldResultsPath = path.resolve(resultsPath, 'old-results.json');
    const rawData = await readFile(oldResultsPath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    let validatedResults: RawLottoRowResult[] = [];
    // Validate the raw data structure
    try {
      const parseResult = z.array(rawLottoRowResultSchema).safeParse(jsonData);
      if (!parseResult.success) {
        throw new Error(
          `Failed to validate old results: ${parseResult.error.flatten()}`,
        );
      }
      validatedResults = parseResult.data;
      console.log(`Found ${validatedResults.length} valid lottery entries`);
    } catch (error) {
      console.log('Error validating old results:', error);
      throw error;
    }

    if (validatedResults.length === 0) {
      console.log('No valid results found');
      return 0;
    }

    // Transform the data into database format
    const formattedResults = parseLottoRowResults(validatedResults);
    console.log(
      `Transformed ${formattedResults.length} results for database insertion`,
    );

    // Save to database
    await saveLottoResults(formattedResults);
    console.log(
      `Successfully saved ${formattedResults.length} old results to database`,
    );
    savedCount = formattedResults.length;
  } catch (error) {
    console.log('Error processing old results:', error);
    throw error;
  }

  return savedCount;
}

export { combineOldResults, saveOldResultsToDb };
