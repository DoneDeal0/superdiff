import { CodeDiff, CodeStatus } from "@models/code";

export function getDiffStatus(statusMap: Set<CodeStatus>): CodeDiff["status"] {
  if (statusMap.has(CodeStatus.UPDATED)) return CodeStatus.UPDATED;

  const isUniqueStatus = (status: CodeStatus) => {
    for (const value of statusMap) {
      if (value !== status) return false;
    }
    return true;
  };

  if (statusMap.size === 0) return CodeStatus.EQUAL;
  if (isUniqueStatus(CodeStatus.ADDED)) return CodeStatus.ADDED;
  if (isUniqueStatus(CodeStatus.DELETED)) return CodeStatus.DELETED;
  if (isUniqueStatus(CodeStatus.EQUAL)) return CodeStatus.EQUAL;
  return CodeStatus.UPDATED;
}
