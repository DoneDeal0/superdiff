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

export function getTextDiff(
  previousText: string | null | undefined,
  currentText: string | null | undefined,
  options: TextDiffOptions = DEFAULT_TEXT_DIFF_OPTIONS,
): TextDiff {
  const previousTokens =
    options?.accuracy === "normal"
      ? tokenizeNormalText(previousText, options)
      : tokenizeStrictText(previousText, options);
  const currentTokens =
    options?.accuracy === "normal"
      ? tokenizeNormalText(currentText, options)
      : tokenizeStrictText(currentText, options);
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
