import { isEqualOptions } from "./model";

export function isEqual(
  a: any,
  b: any,
  options: isEqualOptions = { ignoreArrayOrder: false }
): boolean {
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      return false;
    }
    if (options.ignoreArrayOrder) {
      return a.every((v) =>
        b.some((nextV: any) => JSON.stringify(nextV) === JSON.stringify(v))
      );
    }
    return a.every((v, i) => JSON.stringify(v) === JSON.stringify(b[i]));
  }
  if (typeof a === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

export function isObject(value: any): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
