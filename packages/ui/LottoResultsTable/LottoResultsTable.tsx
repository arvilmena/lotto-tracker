'use client';

import clsx from 'clsx';
import { z } from 'zod';

interface LottoResult {
  id: number;
  name: string;
  drawAt: Date;
  result: number[] | unknown;
  jackpotPrize: number | null;
  winners: number | null;
}

interface LottoResultsTableProps {
  results: LottoResult[];
}

export function LottoResultsTable({ results }: LottoResultsTableProps) {
  const numberParser = z.coerce.number();
  const shouldBetLargerThan = 100_000_000;
  const shouldBetOverall =
    results.filter((result) => {
      const { data: _jackpotPrize } = numberParser.safeParse(
        result.jackpotPrize,
      );
      return _jackpotPrize && _jackpotPrize >= shouldBetLargerThan;
    }).length > 0;
  return (
    <>
      <h1 className="text-center">
        Should I bet today?{' '}
        <>
          <span
            className={clsx({
              'text-green-500': shouldBetOverall,
              'text-red-500': !shouldBetOverall,
            })}
          >
            {shouldBetOverall && <>Yes!</>}
            {!shouldBetOverall && <>No</>}
          </span>
        </>
      </h1>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="">
          <tr>
            <th className="border-b px-4 py-2">Game</th>
            <th className="border-b px-4 py-2">Draw Date</th>
            <th className="border-b px-4 py-2">Jackpot Prize</th>
            <th className="border-b px-4 py-2">Winners</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const { success: successParsingWinners, data: _winners } =
              numberParser.safeParse(result.winners);
            const { data: _jackpotPrize } = numberParser.safeParse(
              result.jackpotPrize,
            );
            const shouldBet =
              _jackpotPrize && _jackpotPrize >= shouldBetLargerThan;
            return (
              <tr key={result.id} className="hover:bg-gray-600">
                <td
                  className={clsx('border-b px-4 py-2', {
                    'text-xl': shouldBet,
                  })}
                >
                  {result.name}
                </td>
                <td
                  className={clsx('border-b px-4 py-2', {
                    'text-xl': shouldBet,
                  })}
                >
                  {new Date(result.drawAt).toLocaleDateString()}
                </td>
                <td
                  className={clsx('border-b px-4 py-2 text-right', {
                    'text-green-500': shouldBet,
                    'text-xl': shouldBet,
                  })}
                >
                  ₱{_jackpotPrize?.toLocaleString()}
                </td>
                <td
                  className={clsx(`border-b px-4 py-2 text-center`, {
                    'text-green-500': _winners === 0,
                    'text-xl': shouldBet,
                  })}
                >
                  {successParsingWinners && <>{result.winners}</>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-center">
        Jackpot price should be larger than ₱
        {shouldBetLargerThan.toLocaleString()}
      </p>
    </>
  );
}
