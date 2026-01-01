import { TextDiff, TextStatus, TextToken, TextTokenDiff } from "@models/text";
import { getDiffStatus } from "../utils/status";

export function getStrictTextDiff(
  previousTokens: TextToken[],
  currentTokens: TextToken[],
): TextDiff {
  const previousTokensMap = new Map<string, TextToken[]>();
  const addedTokensMap = new Map<number, TextToken>();
  const statusMap = new Set<TextStatus>();
  const diff: TextTokenDiff[] = [];

  previousTokens.forEach((previousToken) => {
    const match = previousTokensMap.get(previousToken.normalizedValue);
    if (match) {
      previousTokensMap.set(previousToken.normalizedValue, [
        ...match,
        previousToken,
      ]);
    } else {
      previousTokensMap.set(previousToken.normalizedValue, [previousToken]);
    }
  });

  currentTokens.forEach((currentToken) => {
    const prevTokens = previousTokensMap.get(currentToken.normalizedValue);
    const prevToken = prevTokens?.at(0);
    if (prevTokens && prevToken) {
      const nextStatus =
        prevToken.currentIndex === currentToken.currentIndex
          ? TextStatus.EQUAL
          : TextStatus.MOVED;
      statusMap.add(nextStatus);
      diff.push({
        value: currentToken.value,
        status: nextStatus,
        currentIndex: currentToken.currentIndex,
        previousIndex: prevToken.currentIndex,
      });
      const nextPrevTokens = prevTokens.splice(1);
      if (nextPrevTokens.length === 0) {
        previousTokensMap.delete(prevToken.normalizedValue);
      } else {
        previousTokensMap.set(prevToken.normalizedValue, nextPrevTokens);
      }
    } else {
      addedTokensMap.set(currentToken.currentIndex, currentToken);
      statusMap.add(TextStatus.ADDED);
      diff.push({
        value: currentToken.value,
        status: TextStatus.ADDED,
        currentIndex: currentToken.currentIndex,
        previousIndex: null,
      });
    }
  });

  previousTokensMap.forEach((previousTokens) => {
    previousTokens.forEach((previousToken) => {
      const match = addedTokensMap.get(previousToken.currentIndex);
      if (match) {
        statusMap.add(TextStatus.UPDATED);
        diff[previousToken.currentIndex] = {
          value: match.value,
          previousValue: previousToken.value,
          status: TextStatus.UPDATED,
          previousIndex: null,
          currentIndex: match.currentIndex,
        };
      } else {
        statusMap.add(TextStatus.DELETED);
        diff.push({
          value: previousToken.value,
          status: TextStatus.DELETED,
          previousIndex: previousToken.currentIndex,
          currentIndex: null,
        });
      }
    });
  });

  const status = getDiffStatus(statusMap);

  return { type: "text", status, diff };
}
