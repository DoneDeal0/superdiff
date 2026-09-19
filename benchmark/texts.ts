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

function runWordsBench(wordCount: number, label: string) {
  const prev = generateText(wordCount);
  const curr = generateText(wordCount, true);
  console.log(`\nText diff – ${label} words`);

  const diff = bench("diff", 20, () => diffWords(prev, curr));
  const superdiff = bench("Superdiff", 20, () => {
    getTextDiff(prev, curr, { separation: "word" });
  });
  return { superdiff, diff };
}

function runSentencesBench(sentenceCount: number, label: string) {
  const prev = generateSentences(sentenceCount);
  const curr = generateSentences(sentenceCount, true);
  console.log(`\nText diff – ${label} sentences`);

  const diff = bench("diff", 20, () => diffSentences(prev, curr, {}));
  const superdiff = bench("Superdiff", 20, () => {
    getTextDiff(prev, curr, { separation: "sentence" });
  });
  return { superdiff, diff };
}

export function runTextBench10KWords() {
  return runWordsBench(10_000, "10k");
}

export function runTextBench100KWords() {
  return runWordsBench(100_000, "100k");
}

export function runTextBench10KSentences() {
  return runSentencesBench(10_000, "10k");
}

export function runTextBench100KSentences() {
  return runSentencesBench(100_000, "100k");
}
