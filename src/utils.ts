export function isEqual(a: any, b: any): boolean {
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      return false;
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
