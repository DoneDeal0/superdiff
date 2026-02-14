import { TextDiff, TextStatus } from "@models/text";

export function getDiffStatus(statusMap: Set<TextStatus>): TextDiff["status"] {
  if (statusMap.has(TextStatus.UPDATED)) return TextStatus.UPDATED;

  const isUniqueStatus = (status: TextStatus) => {
    let isUnique = true;
    for (const value of statusMap) {
      if (value !== status) {
        isUnique = false;
        break;
      }
    }
    return isUnique;
  };

  if (isUniqueStatus(TextStatus.ADDED)) return TextStatus.ADDED;
  if (isUniqueStatus(TextStatus.DELETED)) return TextStatus.DELETED;
  if (isUniqueStatus(TextStatus.EQUAL)) return TextStatus.EQUAL;
  return TextStatus.UPDATED;
}
