import pLimit from 'p-limit';
import { db } from './db';
import { lotto } from './schema';

async function main() {
  const lottoSaveLimit = pLimit(1);
  const _lottos: (typeof lotto.$inferInsert)[] = [
    {
      id: 'PCSO_6_49',
      name: '6/49',
      pcsoId: '1',
    },
    {
      id: 'PCSO_6_45',
      name: 'Mega Lotto 6/45',
      pcsoId: '2',
    },
    {
      id: 'PCSO_6_42',
      name: 'Lotto 6/42',
      pcsoId: '13',
    },
    {
      id: 'PCSO_6_58',
      name: 'Ultra Lotto 6/58',
      pcsoId: '18',
    },
    {
      id: 'PCSO_6_55',
      name: 'Grand Lotto 6/55',
      pcsoId: '17',
    },
  ];
  await Promise.all(
    _lottos.map(async (l) =>
      lottoSaveLimit(async () => {
        console.log(`inserting: ${l.name}...`);
        const saved = await db.insert(lotto).values(l);
        console.log(`> inserted!`);
        return saved;
      }),
    ),
  );
}
main();
