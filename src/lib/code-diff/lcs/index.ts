import { myersDiff } from "@core/myers";
import { CodeStatus, CodeTokenDiff } from "@models/code";
import { LCSStatus, Token } from "@models/lcs";

export function getLCSTokenDiff(
  previousTokens: Token[],
  currentTokens: Token[],
): CodeTokenDiff[] {
  const edits = myersDiff(previousTokens, currentTokens);
  const diff: CodeTokenDiff[] = [];

  for (let i = 0; i < edits.length; i++) {
    const edit = edits[i];

    if (edit.status === LCSStatus.EQUAL) {
      diff.push({
        value: currentTokens[edit.curr].value,
        status: CodeStatus.EQUAL,
      });
      continue;
    }

    if (edit.status === LCSStatus.DELETED) {
      const next = edits[i + 1];
      if (next && next.status === LCSStatus.ADDED) {
        diff.push({
          value: currentTokens[next.curr].value,
          previousValue: previousTokens[edit.prev].value,
          status: CodeStatus.UPDATED,
        });
        i++;
        continue;
      }
      diff.push({
        value: previousTokens[edit.prev].value,
        status: CodeStatus.DELETED,
      });
      continue;
    }

    diff.push({
      value: currentTokens[edit.curr].value,
      status: CodeStatus.ADDED,
    });
  }

  return diff;
}
