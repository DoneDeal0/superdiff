import { isEqualOptions } from "./model";

/**
 * Returns true if two data are equal
 * @param {any} a - The original data.
 * @param {any} b - The data to compare.
 * @param {isEqualOptions} options - The options to compare the data.
 * @returns boolean
 */
export function isEqual(
  a: any,
  b: any,
  options: isEqualOptions = { ignoreArrayOrder: false },
): boolean {
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    if (options.ignoreArrayOrder) {
      return a.every((v) =>
        b.some((nextV: any) => JSON.stringify(nextV) === JSON.stringify(v)),
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
 * @param {any} value - The data to check.
 * @returns value is Record<string, any>
 */
export function isObject(value: any): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
