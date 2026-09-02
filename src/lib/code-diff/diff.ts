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
import { pairLines } from "./pair";
import { tokenizeCode } from "./tokenize";
import { getDiffStatus } from "./utils";

function tokenDiffOf(previousLine: string, currentLine: string) {
  return getLCSTokenDiff(tokenizeCode(previousLine), tokenizeCode(currentLine));
}

function lineDiff(
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

export function getTwoPhaseCodeDiff(
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
        lineDiff(
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

    const pairs = pairLines(removed, added);
    let removedIndex = 0;
    let addedIndex = 0;

    const emitDeleted = (line: Token) => {
      diff.push(
        lineDiff(
          line.value,
          undefined,
          null,
          line.index + 1,
          CodeStatus.DELETED,
        ),
      );
      statusSet.add(CodeStatus.DELETED);
    };
    const emitAdded = (line: Token) => {
      diff.push(
        lineDiff(line.value, undefined, line.index + 1, null, CodeStatus.ADDED),
      );
      statusSet.add(CodeStatus.ADDED);
    };

    for (const pair of pairs) {
      while (removedIndex < pair.removed) emitDeleted(removed[removedIndex++]);
      while (addedIndex < pair.added) emitAdded(added[addedIndex++]);

      const removedLine = removed[pair.removed];
      const addedLine = added[pair.added];
      diff.push(
        lineDiff(
          addedLine.value,
          removedLine.value,
          addedLine.index + 1,
          removedLine.index + 1,
          CodeStatus.UPDATED,
          tokenDiffOf(removedLine.value, addedLine.value),
        ),
      );
      statusSet.add(CodeStatus.UPDATED);
      removedIndex = pair.removed + 1;
      addedIndex = pair.added + 1;
    }

    while (removedIndex < removed.length) emitDeleted(removed[removedIndex++]);
    while (addedIndex < added.length) emitAdded(added[addedIndex++]);
  }

  return { type: "code", status: getDiffStatus(statusSet), diff };
}
