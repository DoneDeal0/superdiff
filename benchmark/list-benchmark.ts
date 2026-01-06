import arrDiff from "arr-diff";
import deepDiff from "deep-diff";
import { getListDiff } from "../src";
// import { streamListDiff } from "../src/server";
import { bench } from "./utils";

function generateList(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

function generateObjectList(
  size: number,
  randomize: boolean,
): { id: number; value: number }[] {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    value: randomize && i % 1000 ? i + 10 : i,
  }));
}

function mutateList(
  list: number[],
  updateRate: number,
  deleteRate: number,
  addRate: number,
): number[] {
  const result: number[] = [];

  for (let i = 0; i < list.length; i++) {
    // delete
    if (i % deleteRate === 0) continue;

    // update
    if (i % updateRate === 0) {
      result.push(list[i] + 1_000_000);
    } else {
      result.push(list[i]);
    }

    // add
    if (i % addRate === 0) {
      result.push(-i);
    }
  }

  return result;
}

export function runListBench10K() {
  const prev = generateList(10_000);
  const curr = mutateList(prev, 50, 200, 200);
  console.log("\nList diff – 10k items");

  const deep = bench("deep-diff", 20, () => deepDiff.diff(prev, curr));
  const arrD = bench("arr-diff", 20, () => arrDiff(prev, curr));
  const superdiff = bench("Superdiff", 20, () => getListDiff(prev, curr));
  return { superdiff, deep, arrD };
}

export function runListBench100K() {
  const prev = generateList(100_000);
  const curr = mutateList(prev, 20, 50, 50);
  console.log("\nList diff – 100k items");

  const deep = bench("deep-diff", 20, () => deepDiff.diff(prev, curr));
  const arrD = bench("arr-diff", 20, () => arrDiff(prev, curr));
  const superdiff = bench("Superdiff", 20, () => getListDiff(prev, curr));
  return { superdiff, deep, arrD };
}

// export async function runListStreamBench() {
//   const prev = generateObjectList(1_000_000, false);
//   const curr = generateObjectList(1_000_000, true);

//   console.log("\nList diff – 1M items (streaming)");

//   const superdiff = await benchAsync("Superdiff (stream)", 5, async () => {
//     const diff = streamListDiff(prev, curr, "id");
//     //diff.on("finish", () => Promise.resolve());
//     await once(diff, "finish");
//   });

//   return { superdiff };
// }
