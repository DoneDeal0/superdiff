import {
  DEFAULT_TEXT_DIFF_OPTIONS,
  TextDiff,
  TextDiffOptions,
  TextStatus,
} from "@models/text";
import { tokenizeText } from "./tokenize";
import { getStrictTextDiff } from "./strict";
import { getLCSTextDiff } from "./lcs";

export function getTextDiff(
  previousText: string | null | undefined,
  currentText: string | null | undefined,
  options: TextDiffOptions = DEFAULT_TEXT_DIFF_OPTIONS,
): TextDiff {
  const previousTokens = tokenizeText(previousText, options);
  const currentTokens = tokenizeText(currentText, options);
  if (!previousText && !currentText) {
    return { type: "text", status: TextStatus.EQUAL, diff: [] };
  }

  if (!previousText) {
    return {
      type: "text",
      status: TextStatus.ADDED,
      diff: currentTokens.map((token, i) => ({
        value: token.value,
        status: TextStatus.ADDED,
        currentIndex: i,
        previousIndex: null,
      })),
    };
  }
  if (!currentText) {
    return {
      type: "text",
      status: TextStatus.DELETED,
      diff: previousTokens.map((token, i) => ({
        value: token.value,
        status: TextStatus.DELETED,
        previousIndex: i,
        currentIndex: null,
      })),
    };
  }

  if (options.mode === "strict") {
    return getStrictTextDiff(previousTokens, currentTokens);
  }
  return getLCSTextDiff(previousTokens, currentTokens);
}
