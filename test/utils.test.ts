import { isEqual, isObject } from "../src/utils";

describe("isEqual", () => {
  it("return true if data are the same", () => {
    expect(isEqual(null, null)).toBeTruthy();
    expect(isEqual(undefined, undefined)).toBeTruthy();
    expect(isEqual("hello", "hello")).toBeTruthy();
    expect(isEqual(57, 57)).toBeTruthy();
    expect(isEqual(["hello", "world"], ["hello", "world"])).toBeTruthy();
    expect(
      isEqual(
        [
          { name: "joe", age: 99 },
          { name: "nina", age: 23 },
        ],
        [
          { name: "joe", age: 99 },
          { name: "nina", age: 23 },
        ]
      )
    ).toBeTruthy();
  });
  it("return false if data are different", () => {
    expect(isEqual(null, "hello")).toBeFalsy();
    expect(isEqual("hello", undefined)).toBeFalsy();
    expect(isEqual("hello", "howdy")).toBeFalsy();
    expect(isEqual(57, 51)).toBeFalsy();
    expect(isEqual(["hello", "world"], ["howdy", "world"])).toBeFalsy();
    expect(
      isEqual(
        [
          { name: "joe", age: 99 },
          { name: "nina", age: 23 },
        ],
        [
          { name: "joe", age: 98 },
          { name: "nina", age: 23 },
        ]
      )
    ).toBeFalsy();
  });
});

describe("isObject", () => {
  it("return true if the value has nested values", () => {
    expect(isObject({ name: "joe" })).toBeTruthy();
    expect(isObject({ user: { name: "joe" } })).toBeTruthy();
  });
  it("return false if the value doesn't have nested values", () => {
    expect(isObject("joe")).toBeFalsy();
    expect(isObject(56)).toBeFalsy();
    expect(isObject(true)).toBeFalsy();
    expect(isObject(null)).toBeFalsy();
    expect(isObject(undefined)).toBeFalsy();
    expect(isObject(["hello", "world"])).toBeFalsy();
  });
});
