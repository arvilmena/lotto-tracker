import { TZDate } from '@date-fns/tz';
import { PHILIPPINES_TIMEZONE } from '@lotto-tracker/base';
import {
  insertLottoResultSchema,
  LottoResultDbInsertType,
} from '@lotto-tracker/repositories';
import { z } from 'zod';
import { determineLottoId } from './determineLottoId';

export const rawLottoRowResultSchema = z.object({
  'LOTTO GAME': z.string(),
  COMBINATIONS: z.string(),
  'DRAW DATE': z.string(),
  'JACKPOT (PHP)': z.string(),
  WINNERS: z.string(),
});

export type RawLottoRowResult = z.infer<typeof rawLottoRowResultSchema>;

export function parseLottoRowResults(
  rawResults: RawLottoRowResult[],
): LottoResultDbInsertType[] {
  return rawResults
    .map((result) => {
      const drawDate = result['DRAW DATE'].split('/').map((n) => parseInt(n));
      if (drawDate.length !== 3) {
        console.error(`Invalid draw date format: ${result['DRAW DATE']}`);
        throw new Error(`Invalid draw date format: ${result['DRAW DATE']}`);
      }

      const combinations = result['COMBINATIONS']
        .split('-')
        .map((n) => parseInt(n));

      const lottoId = determineLottoId(result['LOTTO GAME']);
      if (lottoId === 'KNOWN_BUT_NOT_SUPPORTED') {
        return null;
      }
      if (!lottoId) {
        console.error(`Unsupported lotto game: ${result['LOTTO GAME']}`);
        throw new Error(`Unsupported lotto game: ${result['LOTTO GAME']}`);
      }

      const searchResult = {
        lottoId,
        result: combinations,
        drawAt: new TZDate(
          drawDate[2] ?? 0,
          (drawDate[0] ?? 1) - 1,
          drawDate[1] ?? 1,
          PHILIPPINES_TIMEZONE,
        ),
        winners: parseInt(result['WINNERS']),
        jackpotPrize: parseInt(result['JACKPOT (PHP)'].replace(/,/g, '')),
      };

      const parseResult = insertLottoResultSchema.safeParse(searchResult);
      if (!parseResult.success) {
        console.error(
          `Failed to validate lotto result: ${JSON.stringify(parseResult.error.flatten())}`,
        );
        throw new Error(
          `Failed to validate lotto result: ${JSON.stringify(parseResult.error.flatten())}`,
        );
      }
      return parseResult.data;
    })
    .filter((result) => result !== null);
}
