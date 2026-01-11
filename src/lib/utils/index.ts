import { isEqualOptions } from "@models/utils";

/**
 * Returns true if two data are equal
 * @param {unknown} a - The original data.
 * @param {unknown} b - The data to compare.
 * @param {isEqualOptions} options - The options to compare the data.
 * @returns boolean
 */
export function isEqual(
  a: unknown,
  b: unknown,
  options: isEqualOptions = { ignoreArrayOrder: false },
): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    if (!options.ignoreArrayOrder) {
      for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i], b[i], options)) return false;
      }
      return true;
    }

    const counts = new Map<unknown, number>();
    for (const item of a) {
      const key = JSON.stringify(item);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    for (const item of b) {
      const key = JSON.stringify(item);
      const count = counts.get(key);
      if (!count) return false;
      if (count === 1) counts.delete(key);
      else counts.set(key, count - 1);
    }
    return counts.size === 0;
  }

  if (a && b) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    let bKeyCount = 0;
    for (const _ in bObj) {
      if (Object.prototype.hasOwnProperty.call(bObj, _)) bKeyCount++;
    }
    let matchedKeys = 0;
    for (const key in aObj) {
      if (!Object.prototype.hasOwnProperty.call(aObj, key)) continue;
      matchedKeys++;
      if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
      if (!isEqual(aObj[key], bObj[key], options)) return false;
    }
    return matchedKeys === bKeyCount;
  }

  return true;
}

/**
 * Returns true if the provided value is an object
 * @param {unknown} value - The data to check.
 * @returns value is Record<string, unknown>
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && !!value && !Array.isArray(value);
}
