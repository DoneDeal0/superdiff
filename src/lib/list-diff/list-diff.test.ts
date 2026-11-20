import { ListStatus } from "@models/list";
import { getListDiff } from ".";

describe("getListDiff", () => {
  it("returns an empty diff if no lists are provided", () => {
    expect(getListDiff(null, null)).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [],
    });
  });
  it("returns an equal diff if both lists are empty", () => {
    expect(getListDiff([], [])).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [],
    });
  });
  it("consider previous list as completely deleted if no next list is provided", () => {
    expect(
      getListDiff(["mbappe", "mendes", "verratti", "ruiz"], null),
    ).toStrictEqual({
      type: "list",
      status: "deleted",
      diff: [
        {
          value: "mbappe",
          index: null,
          previousIndex: 0,
          status: "deleted",
        },
        {
          value: "mendes",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "verratti",
          index: null,
          previousIndex: 2,
          status: "deleted",
        },
        {
          value: "ruiz",
          index: null,
          previousIndex: 3,
          status: "deleted",
        },
      ],
    });
  });
  it("consider next list as completely added if no previous list is provided", () => {
    expect(
      getListDiff(null, ["mbappe", "mendes", "verratti", "ruiz"]),
    ).toStrictEqual({
      type: "list",
      status: "added",
      diff: [
        {
          value: "mbappe",
          index: 0,
          previousIndex: null,
          status: "added",
        },
        {
          value: "mendes",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: "verratti",
          index: 2,
          previousIndex: null,
          status: "added",
        },
        {
          value: "ruiz",
          index: 3,
          previousIndex: null,
          status: "added",
        },
      ],
    });
  });
  it("detects changes between string lists", () => {
    expect(
      getListDiff(
        ["mbappe", "mendes", "verratti", "ruiz"],
        ["mbappe", "messi", "ruiz"],
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: "mbappe",
          index: 0,
          previousIndex: 0,
          status: "equal",
        },
        {
          value: "messi",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: "ruiz",
          index: 2,
          previousIndex: 3,
          status: "moved",
        },
        {
          value: "mendes",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "verratti",
          index: null,
          previousIndex: 2,
          status: "deleted",
        },
      ],
    });
  });
  it("detects changes between number lists", () => {
    expect(getListDiff([54, 234, 76, 0], [54, 200, 0])).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: 54,
          index: 0,
          previousIndex: 0,
          status: "equal",
        },
        {
          value: 200,
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: 0,
          index: 2,
          previousIndex: 3,
          status: "moved",
        },
        {
          value: 234,
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: 76,
          index: null,
          previousIndex: 2,
          status: "deleted",
        },
      ],
    });
  });
  it("detects changes between object lists", () => {
    expect(
      getListDiff(
        [
          { name: "joe", age: 87 },
          { name: "nina", age: 23 },
          { name: "paul", age: 32 },
        ],
        [
          { name: "paul", age: 32 },
          { name: "joe", age: 88 },
          { name: "nina", age: 23 },
        ],
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { name: "paul", age: 32 },
          index: 0,
          previousIndex: 2,
          status: "moved",
        },
        {
          value: { name: "joe", age: 88 },
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: { name: "nina", age: 23 },
          index: 2,
          previousIndex: 1,
          status: "moved",
        },
        {
          value: { name: "joe", age: 87 },
          index: null,
          previousIndex: 0,
          status: "deleted",
        },
      ],
    });
  });
  it("detects changes between lists containing duplicated values", () => {
    expect(
      getListDiff(["mbappe", "messi"], ["mbappe", "mbappe", "messi"]),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: "mbappe",
          index: 0,
          previousIndex: 0,
          status: "equal",
        },
        {
          value: "mbappe",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: "messi",
          index: 2,
          previousIndex: 1,
          status: "moved",
        },
      ],
    });
    expect(
      getListDiff(
        ["mbappe", "messi", "messi", "mbappe"],
        ["mbappe", "messi", "messi"],
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: "mbappe",
          index: 0,
          previousIndex: 0,
          status: "equal",
        },
        {
          value: "messi",
          index: 1,
          previousIndex: 1,
          status: "equal",
        },
        {
          value: "messi",
          index: 2,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: "mbappe",
          index: null,
          previousIndex: 3,
          status: "deleted",
        },
      ],
    });
    expect(
      getListDiff(
        [
          false,
          true,
          true,
          undefined,
          "hello",
          { name: "joe", age: 88 },
          false,
          13,
        ],
        [
          false,
          false,
          true,
          undefined,
          "hello",
          { name: "joe", age: 88 },
          false,
          { name: "joe", age: 88 },
        ],
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: false,
          index: 0,
          previousIndex: 0,
          status: "equal",
        },
        {
          value: false,
          index: 1,
          previousIndex: 6,
          status: "moved",
        },

        {
          value: true,
          index: 2,
          previousIndex: 1,
          status: "moved",
        },
        {
          value: undefined,
          index: 3,
          previousIndex: 3,
          status: "equal",
        },
        {
          value: "hello",
          index: 4,
          previousIndex: 4,
          status: "equal",
        },
        {
          value: { name: "joe", age: 88 },
          index: 5,
          previousIndex: 5,
          status: "equal",
        },
        {
          value: false,
          index: 6,
          previousIndex: null,
          status: "added",
        },
        {
          value: { name: "joe", age: 88 },
          previousIndex: null,
          index: 7,
          status: "added",
        },
        {
          value: true,
          index: null,
          previousIndex: 2,
          status: "deleted",
        },
        {
          value: 13,
          index: null,
          previousIndex: 7,
          status: "deleted",
        },
      ],
    });
  });
  it("showOnly added and deleted values", () => {
    expect(
      getListDiff(
        [
          false,
          true,
          true,
          undefined,
          "hello",
          { name: "joe", age: 88 },
          false,
          13,
        ],
        [
          false,
          false,
          true,
          undefined,
          "hello",
          { name: "joe", age: 88 },
          false,
          { name: "joe", age: 88 },
        ],
        { showOnly: [ListStatus.ADDED, ListStatus.DELETED] },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: false,
          index: 6,
          previousIndex: null,
          status: "added",
        },
        {
          value: { name: "joe", age: 88 },
          index: 7,
          previousIndex: null,
          status: "added",
        },
        {
          value: true,
          index: null,
          previousIndex: 2,
          status: "deleted",
        },
        {
          value: 13,
          index: null,
          previousIndex: 7,
          status: "deleted",
        },
      ],
    });
  });
  it("returns an empty diff if no key match the required statuses output", () => {
    expect(getListDiff(null, null)).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [],
    });
    expect(
      getListDiff(["mbappe", "mendes", "verratti", "ruiz"], null, {
        showOnly: [ListStatus.MOVED, ListStatus.UPDATED],
      }),
    ).toStrictEqual({
      type: "list",
      status: "deleted",
      diff: [],
    });
  });
  it("returns all values if their status match the required statuses", () => {
    expect(
      getListDiff(null, ["mbappe", "mendes", "verratti", "ruiz"], {
        showOnly: [ListStatus.ADDED],
      }),
    ).toStrictEqual({
      type: "list",
      status: "added",
      diff: [
        {
          value: "mbappe",
          index: 0,
          previousIndex: null,
          status: "added",
        },
        {
          value: "mendes",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: "verratti",
          index: 2,
          previousIndex: null,
          status: "added",
        },
        {
          value: "ruiz",
          index: 3,
          previousIndex: null,
          status: "added",
        },
      ],
    });
  });
  it("adds a number and deletes an object with a colliding referenceKey", () => {
    expect(
      getListDiff<number | { id: number; name: string }>(
        [{ id: 1, name: "Ada" }],
        [1],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: 1,
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: 1, name: "Ada" },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds an object and deletes a number with a colliding referenceKey", () => {
    expect(
      getListDiff<number | { id: number; name: string }>(
        [1],
        [{ id: 1, name: "Ada" }],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: 1, name: "Ada" },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: 1,
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds a string and deletes an object with a colliding referenceKey", () => {
    expect(
      getListDiff<string | { id: string; name: string }>(
        [{ id: "1", name: "Ada" }],
        ["1"],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: "1",
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: "1", name: "Ada" },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds an object and deletes a string with a colliding referenceKey", () => {
    expect(
      getListDiff<string | { id: string; name: string }>(
        ["1"],
        [{ id: "1", name: "Ada" }],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: "1", name: "Ada" },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: "1",
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds a boolean and deletes an object with a colliding referenceKey", () => {
    expect(
      getListDiff<boolean | { id: boolean; name: string }>(
        [{ id: true, name: "Ada" }],
        [true],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: true,
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: true, name: "Ada" },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds an object and deletes a boolean with a colliding referenceKey", () => {
    expect(
      getListDiff<boolean | { id: boolean; name: string }>(
        [true],
        [{ id: true, name: "Ada" }],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: true, name: "Ada" },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: true,
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds null and deletes an object with a colliding referenceKey", () => {
    expect(
      getListDiff([{ id: null, name: "Ada" }], [null], { referenceKey: "id" }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: null,
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: null, name: "Ada" },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds an object and deletes null with a colliding referenceKey", () => {
    expect(
      getListDiff([null], [{ id: null, name: "Ada" }], { referenceKey: "id" }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: null, name: "Ada" },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: null,
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds undefined and deletes an object with a colliding referenceKey", () => {
    expect(
      getListDiff([{ id: undefined, name: "Ada" }], [undefined], {
        referenceKey: "id",
      }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: undefined,
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: undefined, name: "Ada" },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds an object and deletes undefined with a colliding referenceKey", () => {
    expect(
      getListDiff([undefined], [{ id: undefined, name: "Ada" }], {
        referenceKey: "id",
      }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: undefined, name: "Ada" },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: undefined,
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds a keyless object and deletes an object with a colliding referenceKey", () => {
    expect(
      getListDiff([{ id: { k: 1 }, name: "Ada" }], [{ k: 1 }], {
        referenceKey: "id",
      }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { k: 1 },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: { k: 1 }, name: "Ada" },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds an object and deletes a keyless object with a colliding referenceKey", () => {
    expect(
      getListDiff([{ k: 1 }], [{ id: { k: 1 }, name: "Ada" }], {
        referenceKey: "id",
      }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: { k: 1 }, name: "Ada" },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { k: 1 },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds an array and deletes an object with a colliding referenceKey", () => {
    expect(
      getListDiff([{ id: [1], name: "Ada" }], [[1]], { referenceKey: "id" }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: [1],
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: [1], name: "Ada" },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("adds an object and deletes an array with a colliding referenceKey", () => {
    expect(
      getListDiff([[1]], [{ id: [1], name: "Ada" }], { referenceKey: "id" }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: [1], name: "Ada" },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: [1],
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("matches duplicate objects and colliding primitive values independently", () => {
    expect(
      getListDiff(
        [{ id: 1, name: "Ada" }, 1, { id: 1, name: "Ada" }, 1],
        [1, { id: 1, name: "Ada" }, 1, { id: 1, name: "Ada" }],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: 1, previousIndex: 1, index: 0, status: "moved" },
        {
          value: { id: 1, name: "Ada" },
          previousIndex: 0,
          index: 1,
          status: "moved",
        },
        { value: 1, previousIndex: 3, index: 2, status: "moved" },
        {
          value: { id: 1, name: "Ada" },
          previousIndex: 2,
          index: 3,
          status: "moved",
        },
      ],
    });
  });
  it("matches duplicate objects and colliding keyless object values independently", () => {
    expect(
      getListDiff(
        [
          { id: { k: 1 }, name: "Ada" },
          { k: 1 },
          { id: { k: 1 }, name: "Ada" },
          { k: 1 },
        ],
        [
          { k: 1 },
          { id: { k: 1 }, name: "Ada" },
          { k: 1 },
          { id: { k: 1 }, name: "Ada" },
        ],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: { k: 1 }, previousIndex: 1, index: 0, status: "moved" },
        {
          value: { id: { k: 1 }, name: "Ada" },
          previousIndex: 0,
          index: 1,
          status: "moved",
        },
        { value: { k: 1 }, previousIndex: 3, index: 2, status: "moved" },
        {
          value: { id: { k: 1 }, name: "Ada" },
          previousIndex: 2,
          index: 3,
          status: "moved",
        },
      ],
    });
  });
  it("distinguishes a missing referenceKey from an undefined referenceKey", () => {
    expect(
      getListDiff([{ id: undefined }], [{}], { referenceKey: "id" }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: {},
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: undefined },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("distinguishes an undefined referenceKey from a missing referenceKey", () => {
    expect(
      getListDiff([{}], [{ id: undefined }], { referenceKey: "id" }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: undefined },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: {},
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("does not match an array against a referenceKey when ignoring array order", () => {
    expect(
      getListDiff([{ id: [1], name: "Ada" }], [[1]], {
        referenceKey: "id",
        ignoreArrayOrder: true,
      }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: [1],
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: [1], name: "Ada" },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("keeps updates, moves, additions and deletions separate in a mixed list", () => {
    expect(
      getListDiff(
        [{ id: 1, name: "Ada" }, 1, { id: 2, name: "Grace" }, 2],
        [1, { id: 1, name: "Augusta" }, 2, 3],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: 1, previousIndex: 1, index: 0, status: "moved" },
        {
          value: { id: 1, name: "Augusta" },
          previousIndex: 0,
          index: 1,
          status: "updated",
        },
        { value: 2, previousIndex: 3, index: 2, status: "moved" },
        { value: 3, previousIndex: null, index: 3, status: "added" },
        {
          value: { id: 2, name: "Grace" },
          previousIndex: 2,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("deletes unmatched duplicates from both referenceKey and full-value matches", () => {
    expect(
      getListDiff(
        [1, { id: 1, name: "Ada" }, 1, { id: 1, name: "Ada" }],
        [{ id: 1, name: "Ada" }, 1],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: 1, name: "Ada" },
          previousIndex: 1,
          index: 0,
          status: "moved",
        },
        { value: 1, previousIndex: 0, index: 1, status: "moved" },
        { value: 1, previousIndex: 2, index: null, status: "deleted" },
        {
          value: { id: 1, name: "Ada" },
          previousIndex: 3,
          index: null,
          status: "deleted",
        },
      ],
    });
  });
  it("consider object updated if a referenceKey is given and this key hasn't changed", () => {
    expect(
      getListDiff(
        [
          "hello",
          { id: 37, isCool: true, hobbies: ["golf", "ski"] },
          { id: 38, isCool: false, hobbies: ["football"] },
          undefined,
          { id: 8, age: 77 },
          { id: 55, character: { strength: 66 } },
        ],
        [
          { id: 8, age: 77 },
          { id: 37, isCool: false, hobbies: ["golf", "ski"] },
          { id: 38, isCool: false, hobbies: ["football"] },
          undefined,
          { id: 99, character: { strength: 69 } },
        ],
        {
          referenceKey: "id",
        },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: 8, age: 77 },
          index: 0,
          previousIndex: 4,
          status: "moved",
        },
        {
          value: { id: 37, isCool: false, hobbies: ["golf", "ski"] },
          index: 1,
          previousIndex: 1,
          status: "updated",
        },
        {
          value: { id: 38, isCool: false, hobbies: ["football"] },
          index: 2,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: undefined,
          index: 3,
          previousIndex: 3,
          status: "equal",
        },
        {
          value: { id: 99, character: { strength: 69 } },
          index: 4,
          previousIndex: null,
          status: "added",
        },
        {
          value: "hello",
          index: null,
          previousIndex: 0,
          status: "deleted",
        },
        {
          value: { id: 55, character: { strength: 66 } },
          index: null,
          previousIndex: 5,
          status: "deleted",
        },
      ],
    });
  });
  it("consider moved values as updated if the considerMoveAsUpdate option is true", () => {
    expect(
      getListDiff(["mbappe", "messi"], ["mbappe", "mbappe", "messi"], {
        considerMoveAsUpdate: true,
      }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: "mbappe",
          index: 0,
          previousIndex: 0,
          status: "equal",
        },
        {
          value: "mbappe",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: "messi",
          index: 2,
          previousIndex: 1,
          status: "updated",
        },
      ],
    });
    expect(
      getListDiff(
        [
          "hello",
          { id: 37, isCool: true, hobbies: ["golf", "ski"] },
          { id: 38, isCool: false, hobbies: ["football"] },
          undefined,
          { id: 8, age: 77 },
          { id: 55, character: { strength: 66 } },
        ],
        [
          { id: 8, age: 77 },
          { id: 37, isCool: false, hobbies: ["golf", "ski"] },
          { id: 38, isCool: false, hobbies: ["football"] },
          undefined,
          { id: 99, character: { strength: 69 } },
        ],
        {
          referenceKey: "id",
          considerMoveAsUpdate: true,
        },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: 8, age: 77 },
          index: 0,
          previousIndex: 4,
          status: "updated",
        },
        {
          value: { id: 37, isCool: false, hobbies: ["golf", "ski"] },
          index: 1,
          previousIndex: 1,
          status: "updated",
        },
        {
          value: { id: 38, isCool: false, hobbies: ["football"] },
          index: 2,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: undefined,
          index: 3,
          previousIndex: 3,
          status: "equal",
        },
        {
          value: { id: 99, character: { strength: 69 } },
          index: 4,
          previousIndex: null,
          status: "added",
        },
        {
          value: "hello",
          index: null,
          previousIndex: 0,
          status: "deleted",
        },
        {
          value: { id: 55, character: { strength: 66 } },
          index: null,
          previousIndex: 5,
          status: "deleted",
        },
      ],
    });
  });
  it("consider moved values as equal if they have not changed and ignoreArrayOrder option is true", () => {
    expect(
      getListDiff(
        [
          { id: 3, name: "nina", hobbies: ["swiming"] },
          { id: 1, name: "joe", hobbies: ["golf", "fishing"] },
          { id: 2, name: "jack", hobbies: ["coding"] },
        ],
        [
          { id: 1, name: "joe", hobbies: ["golf", "fishing"] },
          { id: 2, name: "jack", hobbies: ["coding"] },
          { id: 3, name: "nina", hobbies: ["swiming"] },
        ],
        {
          ignoreArrayOrder: true,
        },
      ),
    ).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [
        {
          value: { id: 1, name: "joe", hobbies: ["golf", "fishing"] },
          index: 0,
          previousIndex: 1,
          status: "equal",
        },
        {
          value: { id: 2, name: "jack", hobbies: ["coding"] },
          index: 1,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: { id: 3, name: "nina", hobbies: ["swiming"] },
          index: 2,
          previousIndex: 0,
          status: "equal",
        },
      ],
    });
  });
  it("consider moved values as updated if they have changed and ignoreArrayOrder option is true", () => {
    expect(
      getListDiff(
        [
          { id: 3, name: "nina", hobbies: ["swiming"] },
          { id: 1, name: "joseph", hobbies: ["golf", "fishing"] },
          { id: 2, name: "jack", hobbies: ["coding"] },
        ],
        [
          { id: 1, name: "joe", hobbies: ["golf", "fishing"] },
          { id: 2, name: "jack", hobbies: ["coding"] },
          { id: 3, name: "nina", hobbies: ["swiming"] },
        ],
        {
          ignoreArrayOrder: true,
          referenceKey: "id",
        },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: 1, name: "joe", hobbies: ["golf", "fishing"] },
          index: 0,
          previousIndex: 1,
          status: "updated",
        },
        {
          value: { id: 2, name: "jack", hobbies: ["coding"] },
          index: 1,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: { id: 3, name: "nina", hobbies: ["swiming"] },
          index: 2,
          previousIndex: 0,
          status: "equal",
        },
      ],
    });
  });
  it("adds an unordered duplicate after its only previous match is consumed", () => {
    expect(
      getListDiff(
        [[1, 2]],
        [
          [2, 1],
          [2, 1],
        ],
        { ignoreArrayOrder: true },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: [2, 1], previousIndex: 0, index: 0, status: "equal" },
        { value: [2, 1], previousIndex: null, index: 1, status: "added" },
      ],
    });
  });

  it("consumes equivalent unordered arrays in previous-index order", () => {
    expect(
      getListDiff(
        [
          [1, 2],
          [2, 1],
        ],
        [
          [2, 1],
          [1, 2],
        ],
        {
          ignoreArrayOrder: true,
        },
      ),
    ).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [
        { value: [2, 1], previousIndex: 0, index: 0, status: "equal" },
        { value: [1, 2], previousIndex: 1, index: 1, status: "equal" },
      ],
    });
  });

  it("compares nested arrays without considering array or object property order", () => {
    expect(
      getListDiff(
        [{ items: [[1, 2], { a: 1, b: 2 }] }],
        [{ items: [{ b: 2, a: 1 }, [2, 1]] }],
        { ignoreArrayOrder: true },
      ),
    ).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [
        {
          value: { items: [{ b: 2, a: 1 }, [2, 1]] },
          previousIndex: 0,
          index: 0,
          status: "equal",
        },
      ],
    });
  });

  it("compares nested unordered arrays consistently when matching by ID", () => {
    expect(
      getListDiff(
        [{ id: 1, items: [[1, 2], { a: 1, b: 2 }] }],
        [{ id: 1, items: [{ b: 2, a: 1 }, [2, 1]] }],
        { referenceKey: "id", ignoreArrayOrder: true },
      ),
    ).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [
        {
          value: { id: 1, items: [{ b: 2, a: 1 }, [2, 1]] },
          previousIndex: 0,
          index: 0,
          status: "equal",
        },
      ],
    });
  });

  it("preserves duplicate counts inside unordered arrays", () => {
    expect(
      getListDiff([[1, 1, 2]], [[1, 2, 2]], { ignoreArrayOrder: true }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: [1, 2, 2], previousIndex: null, index: 0, status: "added" },
        { value: [1, 1, 2], previousIndex: 0, index: null, status: "deleted" },
      ],
    });
  });

  it("keeps array-valued reference IDs ordered when ignoring list array order", () => {
    expect(
      getListDiff([{ id: [1, 2] }], [{ id: [2, 1] }], {
        referenceKey: "id",
        ignoreArrayOrder: true,
      }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: [2, 1] },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: [1, 2] },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });

  it("keeps unordered full values separate from array-valued reference IDs", () => {
    expect(
      getListDiff<unknown>([[9], { id: [1, 2] }], [[9], [2, 1]], {
        referenceKey: "id",
        ignoreArrayOrder: true,
      }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: [9], previousIndex: 0, index: 0, status: "equal" },
        { value: [2, 1], previousIndex: null, index: 1, status: "added" },
        {
          value: { id: [1, 2] },
          previousIndex: 1,
          index: null,
          status: "deleted",
        },
      ],
    });
  });

  it("keeps ordered arrays distinct by default", () => {
    expect(getListDiff([[1, 2]], [[2, 1]])).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: [2, 1], previousIndex: null, index: 0, status: "added" },
        { value: [1, 2], previousIndex: 0, index: null, status: "deleted" },
      ],
    });
  });

  it("compares each object with a duplicate ID against its own previous value", () => {
    expect(
      getListDiff(
        [
          { id: 1, name: "Ada" },
          { id: 1, name: "Grace" },
        ],
        [
          { id: 1, name: "Ada" },
          { id: 1, name: "Grace" },
        ],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [
        {
          value: { id: 1, name: "Ada" },
          previousIndex: 0,
          index: 0,
          status: "equal",
        },
        {
          value: { id: 1, name: "Grace" },
          previousIndex: 1,
          index: 1,
          status: "equal",
        },
      ],
    });
  });

  it("deletes the actual unmatched object when IDs are duplicated", () => {
    expect(
      getListDiff(
        [
          { id: 1, name: "Ada" },
          { id: 1, name: "Grace" },
        ],
        [{ id: 1, name: "Ada" }],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: 1, name: "Ada" },
          previousIndex: 0,
          index: 0,
          status: "equal",
        },
        {
          value: { id: 1, name: "Grace" },
          previousIndex: 1,
          index: null,
          status: "deleted",
        },
      ],
    });
  });

  it("consumes duplicate IDs in order while distinguishing updates and additions", () => {
    expect(
      getListDiff(
        [
          { id: 1, name: "Ada" },
          { id: 1, name: "Grace" },
        ],
        [
          { id: 1, name: "Augusta" },
          { id: 1, name: "Grace" },
          { id: 1, name: "Lin" },
        ],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: 1, name: "Augusta" },
          previousIndex: 0,
          index: 0,
          status: "updated",
        },
        {
          value: { id: 1, name: "Grace" },
          previousIndex: 1,
          index: 1,
          status: "equal",
        },
        {
          value: { id: 1, name: "Lin" },
          previousIndex: null,
          index: 2,
          status: "added",
        },
      ],
    });
  });

  it("distinguishes null from all non-finite numbers", () => {
    expect(
      getListDiff<number | null>([NaN, Infinity, -Infinity], [null]),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: null, previousIndex: null, index: 0, status: "added" },
        { value: NaN, previousIndex: 0, index: null, status: "deleted" },
        { value: Infinity, previousIndex: 1, index: null, status: "deleted" },
        { value: -Infinity, previousIndex: 2, index: null, status: "deleted" },
      ],
    });
  });

  it("matches non-finite numbers to their own values", () => {
    expect(
      getListDiff([NaN, Infinity, -Infinity], [-Infinity, NaN, Infinity]),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: -Infinity, previousIndex: 2, index: 0, status: "moved" },
        { value: NaN, previousIndex: 0, index: 1, status: "moved" },
        { value: Infinity, previousIndex: 1, index: 2, status: "moved" },
      ],
    });
  });

  it("does not conflate non-finite reference IDs", () => {
    expect(
      getListDiff([{ id: NaN }], [{ id: Infinity }], { referenceKey: "id" }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: Infinity },
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: { id: NaN },
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });

  it("distinguishes dates with different timestamps", () => {
    expect(
      getListDiff([new Date("2020-01-01")], [new Date("2021-01-01")]),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: new Date("2021-01-01"),
          previousIndex: null,
          index: 0,
          status: "added",
        },
        {
          value: new Date("2020-01-01"),
          previousIndex: 0,
          index: null,
          status: "deleted",
        },
      ],
    });
  });

  it("matches distinct date instances with the same timestamp", () => {
    expect(
      getListDiff([new Date("2020-01-01")], [new Date("2020-01-01")]),
    ).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [
        {
          value: new Date("2020-01-01"),
          previousIndex: 0,
          index: 0,
          status: "equal",
        },
      ],
    });
  });

  it("detects a changed nested date when matching by ID", () => {
    expect(
      getListDiff(
        [{ id: 1, date: new Date("2020-01-01") }],
        [{ id: 1, date: new Date("2021-01-01") }],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: 1, date: new Date("2021-01-01") },
          previousIndex: 0,
          index: 0,
          status: "updated",
        },
      ],
    });
  });

  it("distinguishes dates from timestamps, strings and empty objects", () => {
    expect(
      getListDiff<unknown>(
        [new Date(0), 0, "date:0", {}],
        [{}, "date:0", 0, new Date(0)],
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: {}, previousIndex: 3, index: 0, status: "moved" },
        { value: "date:0", previousIndex: 2, index: 1, status: "moved" },
        { value: 0, previousIndex: 1, index: 2, status: "moved" },
        { value: new Date(0), previousIndex: 0, index: 3, status: "moved" },
      ],
    });
  });

  it("compares date-valued reference IDs by timestamp", () => {
    expect(
      getListDiff(
        [{ id: new Date(0), name: "Ada" }],
        [{ id: new Date(0), name: "Grace" }],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: new Date(0), name: "Grace" },
          previousIndex: 0,
          index: 0,
          status: "updated",
        },
      ],
    });
  });

  it("supports an empty property name as the referenceKey", () => {
    expect(
      getListDiff([{ "": 1, name: "Ada" }], [{ "": 1, name: "Grace" }], {
        referenceKey: "",
      }),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { "": 1, name: "Grace" },
          previousIndex: 0,
          index: 0,
          status: "updated",
        },
      ],
    });
  });

  it("distinguishes bigints from numbers and strings", () => {
    expect(getListDiff<unknown>([1n, 1, "1"], ["1", 1n, 1])).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: "1", previousIndex: 2, index: 0, status: "moved" },
        { value: 1n, previousIndex: 0, index: 1, status: "moved" },
        { value: 1, previousIndex: 1, index: 2, status: "moved" },
      ],
    });
  });

  it("matches functions and symbols by identity", () => {
    const callback = () => 1;
    const symbol = Symbol("id");
    expect(
      getListDiff<unknown>([callback, symbol], [symbol, callback]),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: symbol, previousIndex: 1, index: 0, status: "moved" },
        { value: callback, previousIndex: 0, index: 1, status: "moved" },
      ],
    });
  });

  it("keeps serialized-looking strings separate from objects and reference IDs", () => {
    expect(
      getListDiff<unknown>(
        ['{"id":1}', { id: 1 }, "key:1"],
        [{ id: 1 }, "key:1", '{"id":1}'],
        { referenceKey: "id" },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        { value: { id: 1 }, previousIndex: 1, index: 0, status: "moved" },
        { value: "key:1", previousIndex: 2, index: 1, status: "moved" },
        { value: '{"id":1}', previousIndex: 0, index: 2, status: "moved" },
      ],
    });
  });

  it("allows repeated references to the same nested object", () => {
    const shared = { count: 1 };
    expect(
      getListDiff([[shared, shared]], [[{ count: 1 }, { count: 1 }]]),
    ).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [
        {
          value: [{ count: 1 }, { count: 1 }],
          previousIndex: 0,
          index: 0,
          status: "equal",
        },
      ],
    });
  });
});
