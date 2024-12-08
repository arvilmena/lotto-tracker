export const PCSO_6_42_LOTTO_GAME_ID = 'PCSO_6_42';
export const PCSO_6_49_LOTTO_GAME_ID = 'PCSO_6_49';
export const PCSO_6_45_LOTTO_GAME_ID = 'PCSO_6_45';
export const PCSO_6_58_LOTTO_GAME_ID = 'PCSO_6_58';
export const PCSO_6_55_LOTTO_GAME_ID = 'PCSO_6_55';

export const LOTTO_IDS = [
  PCSO_6_42_LOTTO_GAME_ID,
  PCSO_6_49_LOTTO_GAME_ID,
  PCSO_6_45_LOTTO_GAME_ID,
  PCSO_6_58_LOTTO_GAME_ID,
  PCSO_6_55_LOTTO_GAME_ID,
] as const;

export type LottoId = (typeof LOTTO_IDS)[number];
