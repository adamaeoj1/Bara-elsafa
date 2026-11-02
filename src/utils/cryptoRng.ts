import { Player } from '../types/game';

/**
 * Returns a cryptographically secure random float in [0, 1)
 */
export function secureRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 4294967296; // 2^32
  }
  return Math.random();
}

/**
 * Fisher-Yates shuffle using cryptographically secure random numbers
 */
export function cryptoShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Smart Impostor Selection with Fair Anti-Repeat
 * Ensures that players who were Impostor in the last 2 rounds are filtered out,
 * falling back to them only when there are not enough candidates.
 */
export function pickSmartImpostors(
  players: Player[],
  impostorCount: number,
  lastImpostorIds: string[] = []
): { impostorIds: string[]; updatedHistory: string[] } {
  if (players.length === 0) {
    return { impostorIds: [], updatedHistory: [] };
  }

  const effectiveCount = Math.min(impostorCount, players.length);
  const eligiblePlayers = players.filter((p) => !lastImpostorIds.includes(p.id));

  let selectedIds: string[] = [];

  if (eligiblePlayers.length >= effectiveCount) {
    const shuffled = cryptoShuffle(eligiblePlayers);
    selectedIds = shuffled.slice(0, effectiveCount).map((p) => p.id);
  } else {
    // Take all eligible candidates first
    selectedIds = eligiblePlayers.map((p) => p.id);
    const needed = effectiveCount - selectedIds.length;

    // Fill the remainder from the recent impostors pool
    const recentPool = players.filter((p) => lastImpostorIds.includes(p.id));
    const shuffledRecent = cryptoShuffle(recentPool);
    const additional = shuffledRecent.slice(0, needed).map((p) => p.id);
    selectedIds = [...selectedIds, ...additional];
  }

  // Keep history of last 2 rounds
  const maxHistorySize = Math.max(effectiveCount * 2, 4);
  const updatedHistory = [...selectedIds, ...lastImpostorIds.filter((id) => !selectedIds.includes(id))].slice(
    0,
    maxHistorySize
  );

  return { impostorIds: selectedIds, updatedHistory };
}

/**
 * Smart Secret Word Selection with Fair Anti-Repeat
 * Filters out words already played in this category/session until all have been used.
 */
export function pickSmartWord(
  words: string[],
  usedWords: string[] = []
): { secretWord: string; updatedUsedWords: string[] } {
  if (!words || words.length === 0) {
    return { secretWord: '', updatedUsedWords: usedWords };
  }

  const availableWords = words.filter((w) => !usedWords.includes(w));

  let pool = availableWords;
  let baseUsed = usedWords;

  // If all words have been used, reset the pool
  if (availableWords.length === 0) {
    pool = words;
    baseUsed = [];
  }

  const shuffled = cryptoShuffle(pool);
  const secretWord = shuffled[0] || words[0];
  const updatedUsedWords = [...baseUsed, secretWord];

  return { secretWord, updatedUsedWords };
}
