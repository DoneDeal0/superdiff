import { getListDiff } from "../src/list-diff";

describe("getListDiff", () => {
  it("returns an empty diff if no lists are provided", () => {
    expect(getListDiff(null, null)).toStrictEqual({ type: "list", diff: [] });
  });
  it("consider previous list as completely deleted if no next list is provided", () => {
    const res = getListDiff(["mbappe", "mendes", "verratti", "ruiz"], null);
    console.log("res", JSON.stringify(res, null, 2));
    expect(
      getListDiff(["mbappe", "mendes", "verratti", "ruiz"], null)
    ).toStrictEqual({
      type: "list",
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
  it("detects changed values in the list", () => {
    expect(
      getListDiff(
        ["mbappe", "mendes", "verratti", "ruiz"],
        ["mbappe", "messi", "ruiz"]
      )
    ).toStrictEqual({
      type: "list",
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
});
