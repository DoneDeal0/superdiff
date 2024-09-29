import { getListDiff } from "../src/list-diff";
import { LIST_STATUS } from "../src/models/list";

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
          prevIndex: 0,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: "mendes",
          prevIndex: 1,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: "verratti",
          prevIndex: 2,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: "ruiz",
          prevIndex: 3,
          newIndex: null,
          indexDiff: null,
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
          prevIndex: null,
          newIndex: 0,
          indexDiff: null,
          status: "added",
        },
        {
          value: "mendes",
          prevIndex: null,
          newIndex: 1,
          indexDiff: null,
          status: "added",
        },
        {
          value: "verratti",
          prevIndex: null,
          newIndex: 2,
          indexDiff: null,
          status: "added",
        },
        {
          value: "ruiz",
          prevIndex: null,
          newIndex: 3,
          indexDiff: null,
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
          prevIndex: 0,
          newIndex: 0,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: "mendes",
          prevIndex: 1,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: "verratti",
          prevIndex: 2,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: "messi",
          prevIndex: null,
          newIndex: 1,
          indexDiff: null,
          status: "added",
        },
        {
          value: "ruiz",
          prevIndex: 3,
          newIndex: 2,
          indexDiff: -1,
          status: "moved",
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
          prevIndex: 0,
          newIndex: 0,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: 234,
          prevIndex: 1,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: 76,
          prevIndex: 2,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: 200,
          prevIndex: null,
          newIndex: 1,
          indexDiff: null,
          status: "added",
        },
        {
          value: 0,
          prevIndex: 3,
          newIndex: 2,
          indexDiff: -1,
          status: "moved",
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
          value: { name: "joe", age: 87 },
          prevIndex: 0,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: { name: "paul", age: 32 },
          prevIndex: 2,
          newIndex: 0,
          indexDiff: -2,
          status: "moved",
        },
        {
          value: { name: "joe", age: 88 },
          prevIndex: null,
          newIndex: 1,
          indexDiff: null,
          status: "added",
        },
        {
          value: { name: "nina", age: 23 },
          prevIndex: 1,
          newIndex: 2,
          indexDiff: 1,
          status: "moved",
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
          prevIndex: 0,
          newIndex: 0,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: "mbappe",
          prevIndex: null,
          newIndex: 1,
          indexDiff: null,
          status: "added",
        },
        {
          value: "messi",
          prevIndex: 1,
          newIndex: 2,
          indexDiff: 1,
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
          prevIndex: 0,
          newIndex: 0,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: "messi",
          prevIndex: 1,
          newIndex: 1,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: "messi",
          prevIndex: 2,
          newIndex: 2,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: "mbappe",
          prevIndex: 3,
          newIndex: null,
          indexDiff: null,
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
          prevIndex: 0,
          newIndex: 0,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: false,
          prevIndex: 6,
          newIndex: 1,
          indexDiff: -5,
          status: "moved",
        },
        {
          value: true,
          prevIndex: 2,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: true,
          prevIndex: 1,
          newIndex: 2,
          indexDiff: 1,
          status: "moved",
        },
        {
          value: undefined,
          prevIndex: 3,
          newIndex: 3,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: "hello",
          prevIndex: 4,
          newIndex: 4,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: { name: "joe", age: 88 },
          prevIndex: 5,
          newIndex: 5,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: 13,
          prevIndex: 7,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: false,
          prevIndex: null,
          newIndex: 6,
          indexDiff: null,
          status: "added",
        },
        {
          value: { name: "joe", age: 88 },
          prevIndex: null,
          newIndex: 7,
          indexDiff: null,
          status: "added",
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
        { showOnly: [LIST_STATUS.ADDED, LIST_STATUS.DELETED] },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: true,
          prevIndex: 2,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: 13,
          prevIndex: 7,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: false,
          prevIndex: null,
          newIndex: 6,
          indexDiff: null,
          status: "added",
        },
        {
          value: { name: "joe", age: 88 },
          prevIndex: null,
          newIndex: 7,
          indexDiff: null,
          status: "added",
        },
      ],
    });
  });
  it("returns an empty diff if no property match the required statuses output", () => {
    expect(getListDiff(null, null)).toStrictEqual({
      type: "list",
      status: "equal",
      diff: [],
    });
    expect(
      getListDiff(["mbappe", "mendes", "verratti", "ruiz"], null, {
        showOnly: [LIST_STATUS.MOVED, LIST_STATUS.UPDATED],
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
        showOnly: [LIST_STATUS.ADDED],
      }),
    ).toStrictEqual({
      type: "list",
      status: "added",
      diff: [
        {
          value: "mbappe",
          prevIndex: null,
          newIndex: 0,
          indexDiff: null,
          status: "added",
        },
        {
          value: "mendes",
          prevIndex: null,
          newIndex: 1,
          indexDiff: null,
          status: "added",
        },
        {
          value: "verratti",
          prevIndex: null,
          newIndex: 2,
          indexDiff: null,
          status: "added",
        },
        {
          value: "ruiz",
          prevIndex: null,
          newIndex: 3,
          indexDiff: null,
          status: "added",
        },
      ],
    });
  });
  it("consider object updated if a reference property is given and this property hasn't changed", () => {
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
          referenceProperty: "id",
        },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: "hello",
          prevIndex: 0,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: { id: 8, age: 77 },
          prevIndex: 4,
          newIndex: 0,
          indexDiff: -4,
          status: "moved",
        },
        {
          value: { id: 37, isCool: false, hobbies: ["golf", "ski"] },
          prevIndex: 1,
          newIndex: 1,
          indexDiff: 0,
          status: "updated",
        },
        {
          value: { id: 38, isCool: false, hobbies: ["football"] },
          prevIndex: 2,
          newIndex: 2,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: undefined,
          prevIndex: 3,
          newIndex: 3,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: { id: 55, character: { strength: 66 } },
          prevIndex: 5,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: { id: 99, character: { strength: 69 } },
          prevIndex: null,
          newIndex: 4,
          indexDiff: null,
          status: "added",
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
          prevIndex: 0,
          newIndex: 0,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: "mbappe",
          prevIndex: null,
          newIndex: 1,
          indexDiff: null,
          status: "added",
        },
        {
          value: "messi",
          prevIndex: 1,
          newIndex: 2,
          indexDiff: 1,
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
          referenceProperty: "id",
          considerMoveAsUpdate: true,
        },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: "hello",
          prevIndex: 0,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: { id: 8, age: 77 },
          prevIndex: 4,
          newIndex: 0,
          indexDiff: -4,
          status: "updated",
        },
        {
          value: { id: 37, isCool: false, hobbies: ["golf", "ski"] },
          prevIndex: 1,
          newIndex: 1,
          indexDiff: 0,
          status: "updated",
        },
        {
          value: { id: 38, isCool: false, hobbies: ["football"] },
          prevIndex: 2,
          newIndex: 2,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: undefined,
          prevIndex: 3,
          newIndex: 3,
          indexDiff: 0,
          status: "equal",
        },
        {
          value: { id: 55, character: { strength: 66 } },
          prevIndex: 5,
          newIndex: null,
          indexDiff: null,
          status: "deleted",
        },
        {
          value: { id: 99, character: { strength: 69 } },
          prevIndex: null,
          newIndex: 4,
          indexDiff: null,
          status: "added",
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
          prevIndex: 1,
          newIndex: 0,
          indexDiff: -1,
          status: "equal",
        },
        {
          value: { id: 2, name: "jack", hobbies: ["coding"] },
          prevIndex: 2,
          newIndex: 1,
          indexDiff: -1,
          status: "equal",
        },
        {
          value: { id: 3, name: "nina", hobbies: ["swiming"] },
          prevIndex: 0,
          newIndex: 2,
          indexDiff: 2,
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
          referenceProperty: "id",
        },
      ),
    ).toStrictEqual({
      type: "list",
      status: "updated",
      diff: [
        {
          value: { id: 1, name: "joe", hobbies: ["golf", "fishing"] },
          prevIndex: 1,
          newIndex: 0,
          indexDiff: -1,
          status: "updated",
        },
        {
          value: { id: 2, name: "jack", hobbies: ["coding"] },
          prevIndex: 2,
          newIndex: 1,
          indexDiff: -1,
          status: "equal",
        },
        {
          value: { id: 3, name: "nina", hobbies: ["swiming"] },
          prevIndex: 0,
          newIndex: 2,
          indexDiff: 2,
          status: "equal",
        },
      ],
    });
  });
});
