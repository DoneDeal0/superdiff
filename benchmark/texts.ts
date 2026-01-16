import { diffWords, diffSentences } from "diff";
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

export function runTextBench10KWords() {
  const prev = generateText(10_000);
  const curr = generateText(10_000, true);
  console.log("\nText diff – 10k words");

  const diff = bench("diff", 1, () => diffWords(prev, curr));
  const superdiff = bench("Superdiff", 1, () => {
    getTextDiff(prev, curr, {
      separation: "word",
      mode: "visual",
    });
  });
  return { superdiff, diff };
}

export function runTextBench10KSentences() {
  const prev = generateText(10_000);
  const curr = generateText(10_000, true);
  console.log("\nText diff – 100k sentences");

  const diff = bench("diff", 1, () => diffSentences(prev, curr, {}));
  const superdiff = bench("Superdiff", 1, () => {
    getTextDiff(prev, curr, {
      separation: "sentences",
      mode: "visual",
    });
  });
  return { superdiff, diff };
}
