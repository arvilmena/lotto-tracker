import { LottoId } from '@lotto-tracker/base';
import { db, lotto, lottoResult } from '@lotto-tracker/drizzle';
import { desc, eq, getTableColumns, sql } from 'drizzle-orm';

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
