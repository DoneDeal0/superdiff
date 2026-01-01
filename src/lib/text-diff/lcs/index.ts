import { TextDiff, TextStatus, TextToken, TextTokenDiff } from "@models/text";
import { myersDiff } from "./myers";
import { getDiffStatus } from "../utils/status";

export function getLCSTextDiff(
  previousTokens: TextToken[],
  currentTokens: TextToken[],
): TextDiff {
  const edits = myersDiff(previousTokens, currentTokens);
  const diff: TextTokenDiff[] = [];
  const statusSet = new Set<TextStatus>();

  for (let i = 0; i < edits.length; i++) {
    const edit = edits[i];

    if (edit.status === TextStatus.EQUAL) {
      diff.push({
        value: currentTokens[edit.curr].value,
        status: TextStatus.EQUAL,
        currentIndex: edit.curr,
        previousIndex: edit.prev,
      });
      statusSet.add(TextStatus.EQUAL);
    }

    if (edit.status === TextStatus.ADDED) {
      diff.push({
        value: currentTokens[edit.curr].value,
        status: TextStatus.ADDED,
        currentIndex: edit.curr,
        previousIndex: null,
      });
      statusSet.add(TextStatus.ADDED);
    }

    if (edit.status === TextStatus.DELETED) {
      diff.push({
        value: previousTokens[edit.prev].value,
        status: TextStatus.DELETED,
        previousIndex: edit.prev,
        currentIndex: null,
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
