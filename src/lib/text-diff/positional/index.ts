import { TextDiff, TextToken, TextTokenDiff, TextStatus } from "@models/text";
import { getDiffStatus } from "../utils/status";

export function getPositionalTextDiff(
  previousTokens: TextToken[],
  currentTokens: TextToken[],
): TextDiff {
  const previousTokensMap = new Map<string, TextToken[]>();
  const addedTokensMap = new Map<number, TextToken>();
  const statusSet = new Set<TextStatus>();
  const diff: TextTokenDiff[] = [];

  for (let i = 0; i < previousTokens.length; i++) {
    const token = previousTokens[i];
    const key = token.normalizedValue;
    const previousData = previousTokensMap.get(key);
    if (previousData) {
      previousData.push(token);
    } else {
      previousTokensMap.set(key, [token]);
    }
  }

  for (let i = 0; i < currentTokens.length; i++) {
    const token = currentTokens[i];
    const key = token.normalizedValue;
    const prevArr = previousTokensMap.get(key);

    if (prevArr && prevArr.length > 0) {
      const prev = prevArr[0];
      const status =
        prev.index === token.index ? TextStatus.EQUAL : TextStatus.MOVED;

      statusSet.add(status);

      diff.push({
        value: token.value,
        index: token.index,
        previousIndex: prev.index,
        status,
      });

      if (prevArr.length === 1) {
        previousTokensMap.delete(key);
      } else {
        prevArr.shift();
      }
    } else {
      addedTokensMap.set(token.index, token);
      statusSet.add(TextStatus.ADDED);
      diff.push({
        value: token.value,
        index: token.index,
        previousIndex: null,
        status: TextStatus.ADDED,
      });
    }
  }

  for (const previousTokens of previousTokensMap.values()) {
    for (let i = 0; i < previousTokens.length; i++) {
      const previousToken = previousTokens[i];
      const added = addedTokensMap.get(previousToken.index);

      if (added) {
        statusSet.add(TextStatus.UPDATED);
        diff[previousToken.index] = {
          value: added.value,
          index: added.index,
          previousValue: previousToken.value,
          previousIndex: null,
          status: TextStatus.UPDATED,
        };
      } else {
        statusSet.add(TextStatus.DELETED);
        diff.push({
          value: previousToken.value,
          index: null,
          previousIndex: previousToken.index,
          status: TextStatus.DELETED,
        });
      }
    }
  }

  return { type: "text", status: getDiffStatus(statusSet), diff };
}
