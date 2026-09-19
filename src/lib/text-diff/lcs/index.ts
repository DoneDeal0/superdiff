import { myersDiff } from "@core/myers";
import { TextDiff, TextStatus } from "@models/text";
import { getDiffStatus } from "../utils/status";
import { LCSStatus, Token, TokenDiff } from "@models/lcs";

export function getLCSTextDiff(
  previousTokens: Token[],
  currentTokens: Token[],
): TextDiff {
  const edits = myersDiff(previousTokens, currentTokens);
  const diff: TokenDiff<TextStatus>[] = [];
  const statusSet = new Set<TextStatus>();

  for (let i = 0; i < edits.length; i++) {
    const edit = edits[i];

    if (edit.status === LCSStatus.EQUAL) {
      diff.push({
        value: currentTokens[edit.curr].value,
        index: edit.curr,
        previousIndex: edit.prev,
        status: TextStatus.EQUAL,
      });
      statusSet.add(TextStatus.EQUAL);
    }

    if (edit.status === LCSStatus.ADDED) {
      diff.push({
        value: currentTokens[edit.curr].value,
        index: edit.curr,
        previousIndex: null,
        status: TextStatus.ADDED,
      });
      statusSet.add(TextStatus.ADDED);
    }

    if (edit.status === LCSStatus.DELETED) {
      diff.push({
        value: previousTokens[edit.prev].value,
        index: null,
        previousIndex: edit.prev,
        status: TextStatus.DELETED,
      });
      statusSet.add(TextStatus.DELETED);
    }
  }

  return {
    type: "text",
    status: getDiffStatus(statusSet),
    diff,
  };
}
