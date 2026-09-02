import { Token } from "@models/lcs";
import { tokenizeCode } from "./tokenize";

const MAX_PAIRING_BLOCK = 40;
const MIN_SIMILARITY = 0.34;

export type LinePair = { removed: number; added: number };

function similarity(previousLine: string, currentLine: string): number {
  const previousTokens = tokenizeCode(previousLine);
  const currentTokens = tokenizeCode(currentLine);
  if (previousTokens.length === 0 && currentTokens.length === 0) return 1;
  if (previousTokens.length === 0 || currentTokens.length === 0) return 0;

  const pool = new Map<string, number>();
  for (const token of previousTokens) {
    const key = token.normalizedValue;
    pool.set(key, (pool.get(key) || 0) + 1);
  }

  let shared = 0;
  for (const token of currentTokens) {
    const remaining = pool.get(token.normalizedValue);
    if (remaining) {
      shared++;
      pool.set(token.normalizedValue, remaining - 1);
    }
  }

  return (2 * shared) / (previousTokens.length + currentTokens.length);
}

export function pairLines(removed: Token[], added: Token[]): LinePair[] {
  if (removed.length === 0 || added.length === 0) return [];

  if (removed.length * added.length > MAX_PAIRING_BLOCK * MAX_PAIRING_BLOCK) {
    const size = Math.min(removed.length, added.length);
    return Array.from({ length: size }, (_unused, i) => ({
      removed: i,
      added: i,
    }));
  }

  const scored: { score: number; removed: number; added: number }[] = [];
  for (let r = 0; r < removed.length; r++) {
    for (let a = 0; a < added.length; a++) {
      const score = similarity(removed[r].value, added[a].value);
      if (score >= MIN_SIMILARITY) scored.push({ score, removed: r, added: a });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.removed - b.removed);

  const pairs: LinePair[] = [];
  for (const candidate of scored) {
    const crosses = pairs.some(
      (pair) =>
        (candidate.removed - pair.removed) * (candidate.added - pair.added) <=
        0,
    );
    if (crosses) continue;
    pairs.push({ removed: candidate.removed, added: candidate.added });
  }

  return pairs.sort((a, b) => a.removed - b.removed);
}
