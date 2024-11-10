import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const LOTTO_IDS = [
  'PCSO_6_49',
  'PCSO_6_42',
  'PCSO_6_45',
  'PCSO_6_55',
  'PCSO_6_58',
] as const;

type LottoId = (typeof LOTTO_IDS)[number];

export const lotto = sqliteTable(
  'lotto',
  {
    id: text().primaryKey().notNull().$type<LottoId>(),
    name: text().notNull(),
    pcsoId: text().notNull(),
  },
  (table) => {
    return {
      lotto_pcsoId: index('lotto_pcsoId').on(table.pcsoId),
    };
  },
);

export const lottoResult = sqliteTable(
  'lotto_result',
  {
    id: int().primaryKey({ autoIncrement: true }),
    lottoId: text('lotto_id')
      .notNull()
      .references(() => lotto.id, { onDelete: 'cascade' }),
    drawAt: text().notNull(),
    result: text({ mode: 'json' }),
    jackpotPrize: int(),
    winners: int(),
  },
  (table) => {
    return {
      lottoResult_lottoId: index('lottoResult_lottoId').on(table.lottoId),
      lottoResult_lottoId_drawAt: index('lottoResult_lottoId_drawAt').on(
        table.lottoId,
        table.drawAt,
      ),
    };
  },
);
