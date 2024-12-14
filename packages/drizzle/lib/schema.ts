import { LottoId } from '@lotto-tracker/base';
import { index, int, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { dateFnsTzDate, numberArrayJson } from './custom-column-types';

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
    drawAt: dateFnsTzDate().notNull(),
    result: numberArrayJson().notNull(),
    jackpotPrize: int(),
    winners: int(),
  },
  (table) => {
    return {
      lottoResult_lottoId: index('lottoResult_lottoId').on(table.lottoId),
      lottoResult_drawAt: index('lottoResult_drawAt').on(table.drawAt),
      lottoResult_lottoId_drawAt: unique('lottoResult_lottoId_drawAt').on(
        table.lottoId,
        table.drawAt,
      ),
    };
  },
);

export const lottoResultNumber = sqliteTable(
  'lotto_result__number',
  {
    id: int().primaryKey({ autoIncrement: true }),
    lottoResultId: int('lotto_result_id')
      .notNull()
      .references(() => lottoResult.id, { onDelete: 'cascade' }),
    number: int().notNull(),
    order: int().notNull(),
    lottoId: text('lotto_id')
      .notNull()
      .references(() => lotto.id, { onDelete: 'cascade' }),
    drawAt: dateFnsTzDate().notNull(),
  },
  (table) => {
    return {
      lottoResultNumber_lottoResultId_number_order: unique(
        'lottoResultNumber_lottoResultId_number_order',
      ).on(table.lottoResultId, table.number, table.order),
      lottoResultNumber_lottoId_drawAt_number: unique(
        'lottoResultNumber_lottoId_drawAt_number',
      ).on(table.lottoId, table.drawAt, table.number),
      lottoResultNumber_lottoResultId_number: index(
        'lottoResultNumber_lottoResultId_number',
      ).on(table.lottoResultId, table.number),
      lottoResultNumber_lottoId: index('lottoResultNumber_lottoId').on(
        table.lottoId,
      ),
      lottoResultNumber_lottoId_number: index(
        'lottoResultNumber_lottoId_number',
      ).on(table.lottoId, table.number),
    };
  },
);
