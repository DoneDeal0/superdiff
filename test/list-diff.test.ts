import { getListDiff } from "../src/list-diff";

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
      getListDiff(["mbappe", "mendes", "verratti", "ruiz"], null)
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
      getListDiff(null, ["mbappe", "mendes", "verratti", "ruiz"])
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
        ["mbappe", "messi", "ruiz"]
      )
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
        ]
      )
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
      getListDiff(["mbappe", "messi"], ["mbappe", "mbappe", "messi"])
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
        ["mbappe", "messi", "messi"]
      )
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
        ]
      )
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
});
