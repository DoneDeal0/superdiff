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
        index: edit.curr,
        previousIndex: edit.prev,
        status: TextStatus.EQUAL,
      });
      statusSet.add(TextStatus.EQUAL);
    }

    if (edit.status === TextStatus.ADDED) {
      diff.push({
        value: currentTokens[edit.curr].value,
        index: edit.curr,
        previousIndex: null,
        status: TextStatus.ADDED,
      });
      statusSet.add(TextStatus.ADDED);
    }

    if (edit.status === TextStatus.DELETED) {
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
