import { diffLines, diffWordsWithSpace } from "diff";
import { diff_match_patch } from "diff-match-patch";
import { getCodeDiff } from "../src";
import { bench } from "./utils";

function generateCode(functionCount: number): string {
  const lines: string[] = [
    "import { helper } from './helper';",
    "",
    "const MAX_LENGTH = 280;",
    "",
  ];

  for (let i = 0; i < functionCount; i++) {
    lines.push(`export function process${i}(input: Item${i}): Result${i} {`);
    lines.push(`  const cache = new Map<string, Item${i}>();`);
    lines.push(`  for (const entry of input.entries) {`);
    lines.push(`    if (entry.weight > ${i % 997}) {`);
    lines.push(`      cache.set(entry.id, helper(entry, MAX_LENGTH));`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push(`  return { id: ${i}, cache, total: cache.size };`);
    lines.push(`}`);
    lines.push("");
  }

  return lines.join("\n");
}

function mutateCode(code: string, changeRate: number): string {
  return code
    .split("\n")
    .map((line, i) => {
      if (i % changeRate !== 0 || !line.trim()) return line;
      return `${line.replace(/cache/g, "store").replace(/entry/g, "record")} // reviewed`;
    })
    .join("\n");
}

function runCodeBench(functionCount: number, label: string, runs = 20) {
  const previous = generateCode(functionCount);
  const current = mutateCode(previous, 20);
  console.log(`\nCode diff – ${label}`);

  const dmp = new diff_match_patch();

  const jsdiffLines = bench("diff (lines only)", runs, () => {
    diffLines(previous, current);
  });

  const jsdiffFull = bench("diff (lines + tokens)", runs, () => {
    const parts = diffLines(previous, current);
    for (let i = 0; i < parts.length; i++) {
      const removed = parts[i];
      const added = parts[i + 1];
      if (removed.removed && added?.added) {
        diffWordsWithSpace(removed.value, added.value);
        i++;
      }
    }
  });

  const matchPatch = bench("diff-match-patch", runs, () => {
    const chars = dmp.diff_linesToChars_(previous, current);
    const result = dmp.diff_main(chars.chars1, chars.chars2, false);
    dmp.diff_charsToLines_(result, chars.lineArray);
  });

  const superdiff = bench("Superdiff", runs, () => {
    getCodeDiff(previous, current);
  });

  return { superdiff, jsdiffLines, jsdiffFull, matchPatch };
}

export function runCodeBench1K() {
  return runCodeBench(100, "1k lines");
}

export function runCodeBench10K() {
  return runCodeBench(1_000, "10k lines");
}

export function runCodeBench100K() {
  return runCodeBench(10_000, "100k lines", 3);
}
