import * as Diff from "diff";
import { getTextDiff } from "../src";
import { bench } from "./utils";

export function generateText(wordCount: number, mutate = false): string {
  const baseWords = [];
  for (let i = 0; i < wordCount; i++) {
    baseWords.push(`word${i}`);
  }
  if (!mutate) return baseWords.join(" ");
  const mutated = [...baseWords];
  mutated[100] = "changed_word";
  mutated.splice(500, 0, "inserted_word");
  mutated.splice(800, 1);

  return mutated.join(" ");
}

export function runTextBench10K() {
  const prev = generateText(10_000);
  const curr = generateText(10_000, true);
  console.log("\nText diff – 10k words");

  const diff = bench("diff", 1, () => Diff.diffWords(prev, curr));
  const superdiff = bench("Superdiff", 1, () => {
    getTextDiff(prev, curr, { separation: "word", mode: "strict" });
  });
  return { superdiff, diff };
}

export function runTextBench100K() {
  const prev = generateText(100_000);
  const curr = generateText(100_000, true);
  console.log("\nText diff – 100k words");

  const diff = bench("diff", 1, () => Diff.diffWords(prev, curr));
  const superdiff = bench("Superdiff", 1, () => {
    getTextDiff(prev, curr, { separation: "word", mode: "visual" });
  });
  return { superdiff, diff };
}
