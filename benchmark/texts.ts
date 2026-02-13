import { diffWords, diffSentences } from "diff";
import { getTextDiff } from "../src";
import { bench } from "./utils";

function generateText(wordCount: number, mutate = false): string {
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

function generateSentences(sentenceCount: number, mutate = false): string {
  const baseSentences = [];
  for (let i = 0; i < sentenceCount; i++) {
    baseSentences.push(`Sentence number ${i} is here.`);
  }

  if (!mutate) return baseSentences.join(" ");
  const mutated = [...baseSentences];
  mutated[100] = "This sentence has been changed.";
  mutated.splice(500, 0, "An entirely new sentence has been inserted.");
  mutated.splice(800, 1);

  return mutated.join(" ");
}

export function runTextBench10KWords() {
  const prev = generateText(10_000);
  const curr = generateText(10_000, true);
  console.log("\nText diff – 10k words");

  const diff = bench("diff", 1, () => diffWords(prev, curr));
  const superdiff = bench("Superdiff", 1, () => {
    getTextDiff(prev, curr, { separation: "word" });
  });
  return { superdiff, diff };
}

export function runTextBench10KSentences() {
  const prev = generateSentences(10_000);
  const curr = generateSentences(10_000, true);
  console.log("\nText diff – 10k sentences");

  const diff = bench("diff", 1, () => diffSentences(prev, curr, {}));
  const superdiff = bench("Superdiff", 1, () => {
    getTextDiff(prev, curr, { separation: "sentences" });
  });
  return { superdiff, diff };
}
