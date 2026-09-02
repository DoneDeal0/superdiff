import { myersDiff } from "@core/myers";
import {
  CodeDiff,
  CodeLineDiff,
  CodeStatus,
  CodeTokenDiff,
} from "@models/code";
import { LCSStatus, Token } from "@models/lcs";
import { getLCSTokenDiff } from "./lcs";
import { tokenizeLines } from "./lines";
import { getLinePairs } from "./pair";
import { tokenizeCode } from "./tokenize";
import { getDiffStatus } from "./utils";

function getTokenDiff(previousLine: string, currentLine: string) {
  return getLCSTokenDiff(tokenizeCode(previousLine), tokenizeCode(currentLine));
}

function getLineDiff(
  value: string,
  previousValue: string | undefined,
  line: number | null,
  previousLine: number | null,
  status: CodeStatus,
  diff?: CodeTokenDiff[],
): CodeLineDiff {
  const entry: CodeLineDiff = { value, line, previousLine, status };
  if (previousValue !== undefined) entry.previousValue = previousValue;
  if (diff) entry.diff = diff;
  return entry;
}

export function getCodeLinesDiff(
  previousCode: string,
  currentCode: string,
): CodeDiff {
  const previousLines = tokenizeLines(previousCode);
  const currentLines = tokenizeLines(currentCode);
  const edits = myersDiff(previousLines, currentLines);

  const diff: CodeLineDiff[] = [];
  const statusSet = new Set<CodeStatus>();

  let i = 0;
  while (i < edits.length) {
    const edit = edits[i];

    if (edit.status === LCSStatus.EQUAL) {
      diff.push(
        getLineDiff(
          currentLines[edit.curr].value,
          previousLines[edit.prev].value,
          edit.curr + 1,
          edit.prev + 1,
          CodeStatus.EQUAL,
        ),
      );
      statusSet.add(CodeStatus.EQUAL);
      i++;
      continue;
    }

    const removed: Token[] = [];
    const added: Token[] = [];
    while (i < edits.length && edits[i].status !== LCSStatus.EQUAL) {
      const blockEdit = edits[i];
      if (blockEdit.status === LCSStatus.DELETED) {
        removed.push(previousLines[blockEdit.prev]);
      } else if (blockEdit.status === LCSStatus.ADDED) {
        added.push(currentLines[blockEdit.curr]);
      }
      i++;
    }

    const pairs = getLinePairs(removed, added);
    let removedIndex = 0;
    let addedIndex = 0;

    const pushDeletedLine = (line: Token) => {
      diff.push(
        getLineDiff(
          line.value,
          undefined,
          null,
          line.index + 1,
          CodeStatus.DELETED,
        ),
      );
      statusSet.add(CodeStatus.DELETED);
    };
    const pushAddedLine = (line: Token) => {
      diff.push(
        getLineDiff(
          line.value,
          undefined,
          line.index + 1,
          null,
          CodeStatus.ADDED,
        ),
      );
      statusSet.add(CodeStatus.ADDED);
    };

    for (const pair of pairs) {
      while (removedIndex < pair.removed)
        pushDeletedLine(removed[removedIndex++]);
      while (addedIndex < pair.added) pushAddedLine(added[addedIndex++]);

      const removedLine = removed[pair.removed];
      const addedLine = added[pair.added];
      diff.push(
        getLineDiff(
          addedLine.value,
          removedLine.value,
          addedLine.index + 1,
          removedLine.index + 1,
          CodeStatus.UPDATED,
          getTokenDiff(removedLine.value, addedLine.value),
        ),
      );
      statusSet.add(CodeStatus.UPDATED);
      removedIndex = pair.removed + 1;
      addedIndex = pair.added + 1;
    }

    while (removedIndex < removed.length)
      pushDeletedLine(removed[removedIndex++]);
    while (addedIndex < added.length) pushAddedLine(added[addedIndex++]);
  }

  return { type: "code", status: getDiffStatus(statusSet), diff };
}
