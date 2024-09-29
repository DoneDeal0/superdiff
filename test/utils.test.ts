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
        ],
      ),
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
        ],
      ),
    ).toBeFalsy();
    expect(isEqual(["psg"], ["psg", "nantes"])).toBeFalsy();
    expect(isEqual(null, ["hello", "world"])).toBeFalsy();
    expect(isEqual(["hello", "world"], null)).toBeFalsy();
  });
  it("return true if ignoreArrayOrder option is activated and arrays contains the same values regardless of their positions", () => {
    expect(
      isEqual(["hello", "world"], ["world", "hello"], {
        ignoreArrayOrder: true,
      }),
    ).toBeTruthy();
    expect(
      isEqual([44, 45, "world"], [45, "world", 44], { ignoreArrayOrder: true }),
    ).toBeTruthy();
    expect(
      isEqual(
        [
          { name: "joe", age: 88 },
          { name: "nina", isCool: true },
        ],
        [
          { name: "nina", isCool: true },
          { name: "joe", age: 88 },
        ],
        {
          ignoreArrayOrder: true,
        },
      ),
    ).toBeTruthy();
    expect(
      isEqual([true, 55, "hello"], ["hello", 55, true], {
        ignoreArrayOrder: true,
      }),
    ).toBeTruthy();
  });
  it("return false if ignoreArrayOrder option is activated but the arrays don't contain the same values", () => {
    expect(
      isEqual(["hello"], ["world", "hello"], {
        ignoreArrayOrder: true,
      }),
    ).toBeFalsy();
    expect(
      isEqual([44, 47, "world"], [45, "world", 44], { ignoreArrayOrder: true }),
    ).toBeFalsy();
    expect(
      isEqual(
        [
          { name: "joey", age: 88 },
          { name: "nina", isCool: true },
        ],
        [
          { name: "nina", isCool: true },
          { name: "joe", age: 88 },
        ],
        {
          ignoreArrayOrder: true,
        },
      ),
    ).toBeFalsy();
    expect(
      isEqual([false, 55, "hello"], ["hello", 55, true], {
        ignoreArrayOrder: true,
      }),
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
