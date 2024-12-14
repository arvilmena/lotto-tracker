import {
  dbInsertLottoResult,
  LottoResultDbInsertType,
} from '@lotto-tracker/repositories';
import pLimit from 'p-limit';

export async function saveLottoResults(
  results: LottoResultDbInsertType[],
): Promise<void> {
  const saveLimit = pLimit(3);

  await Promise.all(
    results.map((result) =>
      saveLimit(() =>
        dbInsertLottoResult({
          lottoId: result.lottoId,
          result: result.result,
          drawAt: result.drawAt,
          winners: result.winners,
          jackpotPrize: result.jackpotPrize,
        }),
      ),
    ),
  );
}
