import {
  LottoId,
  PCSO_6_42_LOTTO_GAME_ID,
  PCSO_6_45_LOTTO_GAME_ID,
  PCSO_6_49_LOTTO_GAME_ID,
  PCSO_6_55_LOTTO_GAME_ID,
  PCSO_6_58_LOTTO_GAME_ID,
} from '@lotto-tracker/base';

// Helper function to determine lotto ID
export function determineLottoId(
  lottoGame: string,
): LottoId | null | 'KNOWN_BUT_NOT_SUPPORTED' {
  if (lottoGame.includes('6/42')) return PCSO_6_42_LOTTO_GAME_ID;
  if (lottoGame.includes('6/45')) return PCSO_6_45_LOTTO_GAME_ID;
  if (lottoGame.includes('6/49')) return PCSO_6_49_LOTTO_GAME_ID;
  if (lottoGame.includes('6/55')) return PCSO_6_55_LOTTO_GAME_ID;
  if (lottoGame.includes('6/58')) return PCSO_6_58_LOTTO_GAME_ID;
  if (lottoGame.includes('2D Lotto')) return 'KNOWN_BUT_NOT_SUPPORTED';
  if (lottoGame.includes('3D Lotto')) return 'KNOWN_BUT_NOT_SUPPORTED';
  if (lottoGame.includes('4D Lotto')) return 'KNOWN_BUT_NOT_SUPPORTED';
  if (lottoGame.includes('6D Lotto')) return 'KNOWN_BUT_NOT_SUPPORTED';
  return null;
}
