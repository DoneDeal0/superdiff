import deepDiff from "deep-diff";
import { diff as deepObjectDiff } from "deep-object-diff";
import microDiff from "microdiff";
import { bench } from "./utils";
import { getObjectDiff } from "../src";

function generateFlatObject(
  size: number,
  randomize: boolean,
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < size; i++) {
    if (randomize && i === 100) {
      obj[`key_${i}`] = "changed_value";
    } else {
      obj[`key_${i}`] = i;
    }
  }
  return obj;
}

function generateNestedObject(
  depth: number,
  breadth: number,
  prefix = "key",
): Record<string, unknown> {
  if (depth === 0) return {};

  const obj: Record<string, unknown> = {};
  for (let i = 0; i < breadth; i++) {
    obj[`${prefix}_${i}`] =
      depth === 1
        ? i
        : generateNestedObject(depth - 1, breadth, `${prefix}_${i}`);
  }
  return obj;
}

function mutateNestedObject(
  obj: Record<string, unknown>,
  depth: number,
  mutationRate: number,
) {
  let count = 0;

  function walk(node: Record<string, unknown>, level: number) {
    if (level === depth) return;

    for (const key of Object.keys(node)) {
      count++;

      if (count % (mutationRate * 3) === 0) {
        node[`added_${count}`] = { new: true };
      }

      if (count % mutationRate === 0) {
        node[key] = `changed_${count}`;
        continue;
      }

      if (count % (mutationRate * 5) === 0) {
        delete node[key];
        continue;
      }

      if (typeof node[key] === "object") {
        //@ts-expect-error - node exists
        walk(node[key], level + 1);
      }
    }
  }

  walk(obj, 0);
}

export function runObjectBench10K() {
  const prev = generateFlatObject(10_000, false);
  const curr = generateFlatObject(10_000, true);
  console.log(`\nObject diff – 10k keys`);
  const deep = bench("deep-diff", 20, () => deepDiff.diff(prev, curr));
  const micro = bench("microdiff", 20, () => microDiff(prev, curr));
  const deepObject = bench("deep-object-diff", 20, () =>
    deepObjectDiff(prev, curr),
  );
  const superdiff = bench("Superdiff", 20, () => getObjectDiff(prev, curr));
  return { superdiff, micro, deep, deepObject };
}

export function runObjectBench100K() {
  const prev = generateFlatObject(100_000, false);
  const curr = generateFlatObject(100_000, true);
  console.log("\nObject diff – 100k keys");
  const deep = bench("deep-diff", 20, () => deepDiff.diff(prev, curr));
  const micro = bench("microdiff", 20, () => microDiff(prev, curr));
  const deepObject = bench("deep-object-diff", 20, () =>
    deepObjectDiff(prev, curr),
  );
  const superdiff = bench("Superdiff", 20, () => getObjectDiff(prev, curr));
  return { superdiff, micro, deep, deepObject };
}

export function runNestedObjectBench() {
  const prev = generateNestedObject(5, 10); // ~100k nodes
  const curr = generateNestedObject(5, 10);
  mutateNestedObject(curr, 5, 10);

  console.log("\nObject diff – nested (~100K nodes)");

  const deep = bench("deep-diff", 10, () => deepDiff.diff(prev, curr));

  const deepObject = bench("deep-object-diff", 10, () =>
    deepObjectDiff(prev, curr),
  );
  const superdiff = bench("Superdiff", 10, () => getObjectDiff(prev, curr));

  return { superdiff, deep, deepObject };
}
