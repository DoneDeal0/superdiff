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
  if (typeof a === "number") return Number.isNaN(a) && Number.isNaN(b);
  if (a === null || b === null || typeof a !== "object") return false;

  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray !== bIsArray) return false;

  if (aIsArray && bIsArray) {
    if (a.length !== b.length) return false;
    if (!options.ignoreArrayOrder) {
      for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i], b[i], options)) return false;
      }
      return true;
    }

    const counts = new Map<unknown, number>();
    for (const item of a) {
      const key =
        typeof item === "object" || typeof item === "string"
          ? stableStringify(item, options.ignoreArrayOrder)
          : item;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    for (const item of b) {
      const key =
        typeof item === "object" || typeof item === "string"
          ? stableStringify(item, options.ignoreArrayOrder)
          : item;
      const count = counts.get(key);
      if (!count) return false;
      if (count === 1) counts.delete(key);
      else counts.set(key, count - 1);
    }
    return counts.size === 0;
  }

  if (a instanceof Date || b instanceof Date) {
    return (
      a instanceof Date &&
      b instanceof Date &&
      Object.is(a.getTime(), b.getTime())
    );
  }

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

/**
 * Returns true if the provided value is an object
 * @param {unknown} value - The data to check.
 * @returns value is Record<string, unknown>
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && !!value && !Array.isArray(value);
}

/**
 * Serializes values with stable object keys and optional recursive array ordering.
 * @param {unknown} value - The data to check.
 * @param {boolean} ignoreArrayOrder - Whether to ignore array order recursively.
 * @returns string
 */
export function stableStringify(
  value: unknown,
  ignoreArrayOrder = false,
): string {
  if (value === null || typeof value !== "object") {
    if (typeof value === "number") return String(value);
    if (typeof value === "bigint") return `${value}n`;
    if (value === undefined) return "undefined";
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (ignoreArrayOrder) {
      const items = new Array<string>(value.length);
      for (let i = 0; i < value.length; i++) {
        items[i] = stableStringify(value[i], ignoreArrayOrder);
      }
      return `[${items.sort().join(",")}]`;
    }
    let result = "[";
    for (let i = 0; i < value.length; i++) {
      result += stableStringify(value[i], ignoreArrayOrder);
      if (i < value.length - 1) result += ",";
    }
    return result + "]";
  }
  if (value instanceof Date) return `date:${value.getTime()}`;

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();
  let result = "{";
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result +=
      JSON.stringify(key) +
      ":" +
      stableStringify(objectValue[key], ignoreArrayOrder);
    if (i < keys.length - 1) result += ",";
  }
  return result + "}";
}
