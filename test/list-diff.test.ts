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
  it("detects changed values in a string list", () => {
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
  it("detects changed values in a number list", () => {
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
  it("detects changed values in an object list", () => {
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
});
