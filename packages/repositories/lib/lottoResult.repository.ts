import { LottoId } from '@lotto-tracker/base';
import {
  db,
  lotto,
  lottoResult,
  lottoResultNumber,
} from '@lotto-tracker/drizzle';
import { desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  dateFnsTzDateSchema,
  numberArrayJsonSchema,
} from '../../drizzle/lib/custom-column-types';

export const insertLottoResultSchema = createInsertSchema(lottoResult, {
  drawAt: () => dateFnsTzDateSchema,
  result: () => numberArrayJsonSchema,
});
type LottoResultDbInsertType = z.infer<typeof insertLottoResultSchema>;

export async function dbInsertLottoResult(value: LottoResultDbInsertType) {
  console.log(`inserting: `, value);
  const [newLottoResult] = await db
    .insert(lottoResult)
    .values(value)
    .onConflictDoNothing()
    .returning();

  if (newLottoResult) {
    const resultCombinations = value.result;
    const drawAt = value.drawAt;
    // save each number
    for (let i = 0; i < resultCombinations.length; i++) {
      const __number = resultCombinations[i];
      if (!__number)
        throw new Error(
          `not sure why ${i} of ${resultCombinations} is returning ${__number} for ${value.lottoId} at ${value.drawAt}`,
        );
      await db.insert(lottoResultNumber).values({
        lottoResultId: newLottoResult.id,
        number: __number,
        order: i + 1,
        lottoId: newLottoResult.lottoId,
        drawAt,
      });
    }
  }
  return newLottoResult;
}

export async function getLastCrawledAt(lottoGameId: LottoId) {
  const [result] = await db
    .select()
    .from(lottoResult)
    .innerJoin(lotto, eq(lotto.id, lottoResult.lottoId))
    .where(eq(lottoResult.lottoId, lottoGameId))
    .orderBy(desc(lottoResult.drawAt))
    .limit(1);
  return result;
}

export async function getLastDrawForEachLottoGame() {
  return await db
    .select({
      ...getTableColumns(lotto),
      ...getTableColumns(lottoResult),
      latest: sql`max(${lottoResult.drawAt})`,
    })
    .from(lottoResult)
    .innerJoin(lotto, eq(lotto.id, lottoResult.lottoId))
    .groupBy(lottoResult.lottoId)
    .orderBy(desc(lottoResult.jackpotPrize));
}
