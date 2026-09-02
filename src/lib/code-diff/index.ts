import { CodeDiff, CodeStatus } from "@models/code";
import { getCodeLinesDiff } from "./diff";
import { tokenizeLines } from "./lines";

function getSingleCodeDiff(code: string, status: CodeStatus): CodeDiff {
  const isAdded = status === CodeStatus.ADDED;
  return {
    type: "code",
    status,
    diff: tokenizeLines(code).map((line) => ({
      value: line.value,
      line: isAdded ? line.index + 1 : null,
      previousLine: isAdded ? null : line.index + 1,
      status,
    })),
  };
}

/**
 *Compares two codes and returns a structured diff.
 * Lines are diffed first, then the lines that changed are diffed token by token.
 * To diff files, read them first: `getCodeDiff(await previous.text(), await current.text())`.
 * @param {string | null | undefined} previousCode - The original code.
 * @param {string | null | undefined} currentCode - The current code.
 * @returns CodeDiff
 */
export function getCodeDiff(
  previousCode: string | null | undefined,
  currentCode: string | null | undefined,
): CodeDiff {
  if (!previousCode && !currentCode) {
    return { type: "code", status: CodeStatus.EQUAL, diff: [] };
  }
  if (!previousCode) {
    return getSingleCodeDiff(currentCode as string, CodeStatus.ADDED);
  }
  if (!currentCode) {
    return getSingleCodeDiff(previousCode as string, CodeStatus.DELETED);
  }
  return getCodeLinesDiff(previousCode, currentCode);
}
