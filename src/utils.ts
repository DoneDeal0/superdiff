import { isEqualOptions } from "./models/utils";

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
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    if (options.ignoreArrayOrder) {
      return a.every((v) =>
        b.some((nextV) => JSON.stringify(nextV) === JSON.stringify(v)),
      );
    }
    return a.every((v, i) => JSON.stringify(v) === JSON.stringify(b[i]));
  }
  if (typeof a === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

/**
 * Returns true if the provided value is an object
 * @param {unknown} value - The data to check.
 * @returns value is Record<string, unknown>
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
