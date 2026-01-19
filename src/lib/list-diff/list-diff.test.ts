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
});
