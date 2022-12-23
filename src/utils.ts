export function isEqual(a: any, b: any): boolean {
  if (typeof a !== typeof b) return true;
  if (Array.isArray(a)) {
    return a.toString() === b.toString();
  }
  if (typeof a === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

export function hasNestedValues(value: any): value is Record<string, any> {
  return typeof value === "object" && !Array.isArray(value);
}
