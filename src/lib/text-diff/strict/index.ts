import { TextDiff, TextToken, TextTokenDiff, TextStatus } from "@models/text";
import { getDiffStatus } from "../utils/status";

export function getStrictTextDiff(
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
        prev.currentIndex === token.currentIndex
          ? TextStatus.EQUAL
          : TextStatus.MOVED;

      statusSet.add(status);

      diff.push({
        value: token.value,
        status,
        currentIndex: token.currentIndex,
        previousIndex: prev.currentIndex,
      });

      if (prevArr.length === 1) {
        previousTokensMap.delete(key);
      } else {
        prevArr.shift();
      }
    } else {
      addedTokensMap.set(token.currentIndex, token);
      statusSet.add(TextStatus.ADDED);
      diff.push({
        value: token.value,
        status: TextStatus.ADDED,
        currentIndex: token.currentIndex,
        previousIndex: null,
      });
    }
  }

  for (const previousTokens of previousTokensMap.values()) {
    for (let i = 0; i < previousTokens.length; i++) {
      const previousToken = previousTokens[i];
      const added = addedTokensMap.get(previousToken.currentIndex);

      if (added) {
        statusSet.add(TextStatus.UPDATED);
        diff[previousToken.currentIndex] = {
          value: added.value,
          previousValue: previousToken.value,
          status: TextStatus.UPDATED,
          previousIndex: null,
          currentIndex: added.currentIndex,
        };
      } else {
        statusSet.add(TextStatus.DELETED);
        diff.push({
          value: previousToken.value,
          status: TextStatus.DELETED,
          previousIndex: previousToken.currentIndex,
          currentIndex: null,
        });
      }
    }
  }

  return { type: "text", status: getDiffStatus(statusSet), diff };
}
