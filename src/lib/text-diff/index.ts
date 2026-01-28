import {
  DEFAULT_TEXT_DIFF_OPTIONS,
  TextDiff,
  TextDiffOptions,
  TextStatus,
} from "@models/text";
import { getPositionalTextDiff } from "./positional";
import { getLCSTextDiff } from "./lcs";
import { tokenizeNormalText } from "./tokenize/normal";
import { tokenizeStrictText } from "./tokenize/strict";

/**
 *Compares two texts and returns a structured diff at a character, word, or sentence level.
 * @param {string | null | undefined} previousText - The original text.
 * @param {string | null | undefined} currentText - The current text.
 * @param {TextDiffOptions} options - Options to refine your output.
  - `separation` whether you want a `character`, `word` or `sentence` based diff.
  - `accuracy`: 
    - `normal` (default): fastest mode, simple tokenization.
    - `high`: slower but exact tokenization. Handles all language subtleties (Unicode, emoji, CJK scripts, locale‑aware segmentation when a locale is provided).
  - `detectMoves`: 
    - `false` (default): optimized for readability. Token moves are ignored so insertions don’t cascade and break equality (recommended for UI diffing).
    - `true`: semantically precise, but noisier — a single insertion shifts all following tokens, breaking equality.
  - `ignoreCase`: if `true`, `hello` and `HELLO` are considered equal.
  - `ignorePunctuation`: if `true`, `hello!` and `hello` are considered equal.
  - `locale`: the locale of your text. Enables locale‑aware segmentationb in high accuracy mode.
 * @returns TextDiff
 */
export function getTextDiff(
  previousText: string | null | undefined,
  currentText: string | null | undefined,
  options: TextDiffOptions = DEFAULT_TEXT_DIFF_OPTIONS,
): TextDiff {
  const previousTokens =
    options?.accuracy === "high"
      ? tokenizeStrictText(previousText, options)
      : tokenizeNormalText(previousText, options);
  const currentTokens =
    options?.accuracy === "high"
      ? tokenizeStrictText(currentText, options)
      : tokenizeNormalText(currentText, options);

  if (!previousText && !currentText) {
    return { type: "text", status: TextStatus.EQUAL, diff: [] };
  }

  if (!previousText) {
    return {
      type: "text",
      status: TextStatus.ADDED,
      diff: currentTokens.map((token, i) => ({
        value: token.value,
        index: i,
        previousIndex: null,
        status: TextStatus.ADDED,
      })),
    };
  }
  if (!currentText) {
    return {
      type: "text",
      status: TextStatus.DELETED,
      diff: previousTokens.map((token, i) => ({
        value: token.value,
        index: null,
        previousIndex: i,
        status: TextStatus.DELETED,
      })),
    };
  }
  if (options.detectMoves) {
    return getPositionalTextDiff(previousTokens, currentTokens);
  }
  return getLCSTextDiff(previousTokens, currentTokens);
}
