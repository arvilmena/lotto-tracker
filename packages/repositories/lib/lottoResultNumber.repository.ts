import { db, lottoResultNumber } from '@lotto-tracker/drizzle';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { dateFnsTzDateSchema } from '../../drizzle/lib/custom-column-types';

export const insertLottoResultNumberSchema = createInsertSchema(
  lottoResultNumber,
  {
    drawAt: () => dateFnsTzDateSchema,
  },
);
type LottoResultNumberDbInsertType = z.infer<
  typeof insertLottoResultNumberSchema
>;

export async function dbInsertLottoResultNumber(
  value: LottoResultNumberDbInsertType,
) {
  const [result] = await db
    .insert(lottoResultNumber)
    .values(value)
    .onConflictDoNothing()
    .returning();
  return result;
}
