import { getTextDiff } from ".";

describe("getTextDiff - general", () => {
  it("returns all equal tokens when texts are identical", () => {
    expect(getTextDiff("A B C", "A B C")).toStrictEqual({
      type: "text",
      status: "equal",
      diff: [
        { value: "A", status: "equal", currentIndex: 0, previousIndex: 0 },
        { value: "B", status: "equal", currentIndex: 1, previousIndex: 1 },
        { value: "C", status: "equal", currentIndex: 2, previousIndex: 2 },
      ],
    });
  });

  it("marks all tokens as added when previous text is empty", () => {
    expect(getTextDiff("", "A B")).toStrictEqual({
      type: "text",
      status: "added",
      diff: [
        { value: "A", status: "added", currentIndex: 0, previousIndex: null },
        { value: "B", status: "added", currentIndex: 1, previousIndex: null },
      ],
    });
  });

  it("marks all tokens as deleted when current text is empty", () => {
    expect(getTextDiff("A B", "")).toStrictEqual({
      type: "text",
      status: "deleted",
      diff: [
        { value: "A", status: "deleted", currentIndex: null, previousIndex: 0 },
        { value: "B", status: "deleted", currentIndex: null, previousIndex: 1 },
      ],
    });
  });
});

describe("getTextDiff – visual", () => {
  it("merges delete + add at same position into updated", () => {
    expect(getTextDiff("A B C", "A X C")).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "A", status: "equal", currentIndex: 0, previousIndex: 0 },
        {
          value: "B",
          status: "deleted",
          currentIndex: null,
          previousIndex: 1,
        },
        {
          value: "X",
          status: "added",
          currentIndex: 1,
          previousIndex: null,
        },
        { value: "C", status: "equal", currentIndex: 2, previousIndex: 2 },
      ],
    });
  });

  it("represents reordering as delete + add in visual mode", () => {
    expect(getTextDiff("A B C A B", "A B A B C")).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "A", status: "equal", currentIndex: 0, previousIndex: 0 },
        { value: "B", status: "equal", currentIndex: 1, previousIndex: 1 },
        { value: "C", status: "deleted", currentIndex: null, previousIndex: 2 },
        { value: "A", status: "equal", currentIndex: 2, previousIndex: 3 },
        { value: "B", status: "equal", currentIndex: 3, previousIndex: 4 },
        { value: "C", status: "added", currentIndex: 4, previousIndex: null },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by word", () => {
    expect(
      getTextDiff(
        "Solemnly he came and mounted the rounded gunrest.",
        "He, solemnly came and he mounted square gunrest.",
        { ignoreCase: true, separation: "word" },
      ),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "He,", status: "added", currentIndex: 0, previousIndex: null },
        {
          value: "solemnly",
          status: "equal",
          currentIndex: 1,
          previousIndex: 0,
        },
        {
          value: "he",
          status: "deleted",
          currentIndex: null,
          previousIndex: 1,
        },
        { value: "came", status: "equal", currentIndex: 2, previousIndex: 2 },
        { value: "and", status: "equal", currentIndex: 3, previousIndex: 3 },
        { value: "he", status: "added", currentIndex: 4, previousIndex: null },
        {
          value: "mounted",
          status: "equal",
          currentIndex: 5,
          previousIndex: 4,
        },
        {
          value: "the",
          status: "deleted",
          currentIndex: null,
          previousIndex: 5,
        },
        {
          value: "rounded",
          status: "deleted",
          currentIndex: null,
          previousIndex: 6,
        },
        {
          value: "square",
          status: "added",
          currentIndex: 6,
          previousIndex: null,
        },
        {
          value: "gunrest.",
          status: "equal",
          currentIndex: 7,
          previousIndex: 7,
        },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by character", () => {
    expect(
      getTextDiff("abc", "xcy", { separation: "character", mode: "visual" }),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "a",
          status: "deleted",
          previousIndex: 0,
          currentIndex: null,
        },
        {
          value: "b",
          status: "deleted",
          previousIndex: 1,
          currentIndex: null,
        },
        {
          value: "x",
          status: "added",
          currentIndex: 0,
          previousIndex: null,
        },
        { value: "c", status: "equal", currentIndex: 1, previousIndex: 2 },
        {
          value: "y",
          status: "added",
          currentIndex: 2,
          previousIndex: null,
        },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by sentence", () => {
    expect(
      getTextDiff(
        "Hello world. I like turtles. Goodbye moon.",
        "Hello world. I love turtles. Welcome sun.",
        { separation: "sentence", mode: "visual" },
      ),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "Hello world.",
          status: "equal",
          currentIndex: 0,
          previousIndex: 0,
        },
        {
          value: "I like turtles.",
          status: "deleted",
          previousIndex: 1,
          currentIndex: null,
        },
        {
          value: "Goodbye moon.",
          status: "deleted",
          previousIndex: 2,
          currentIndex: null,
        },
        {
          value: "I love turtles.",
          status: "added",
          currentIndex: 1,
          previousIndex: null,
        },
        {
          value: "Welcome sun.",
          status: "added",
          currentIndex: 2,
          previousIndex: null,
        },
      ],
    });
  });

  it("ignores case when ignoreCase is true", () => {
    const diff = getTextDiff("Hello WORLD", "hello world", {
      ignoreCase: true,
    });

    expect(diff.diff.every((d) => d.status === "equal")).toBe(true);
  });

  it("ignores punctuation when ignorePunctuation is true", () => {
    const diff = getTextDiff("hello!", "hello", {
      ignorePunctuation: true,
    });

    expect(diff.diff[0].status).toBe("equal");
  });

  it("handles character separation", () => {
    expect(
      getTextDiff("abc", "axc", { separation: "character" }),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "a", status: "equal", currentIndex: 0, previousIndex: 0 },
        {
          value: "b",
          status: "deleted",
          currentIndex: null,
          previousIndex: 1,
        },
        {
          value: "x",
          status: "added",
          currentIndex: 1,
          previousIndex: null,
        },
        { value: "c", status: "equal", currentIndex: 2, previousIndex: 2 },
      ],
    });
  });

  it("handles sentence separation", () => {
    expect(
      getTextDiff("Hello world. How are you?", "Hello world. I'm fine.", {
        separation: "sentence",
      }),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "Hello world.",
          status: "equal",
          currentIndex: 0,
          previousIndex: 0,
        },
        {
          value: "How are you?",
          status: "deleted",
          currentIndex: null,
          previousIndex: 1,
        },
        {
          value: "I'm fine.",
          status: "added",
          currentIndex: 1,
          previousIndex: null,
        },
      ],
    });
  });
});

describe("getTextDiff – strict", () => {
  it("merges delete + add at same position into updated", () => {
    expect(getTextDiff("A B C", "A X C", { mode: "strict" })).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "A", status: "equal", currentIndex: 0, previousIndex: 0 },
        {
          value: "X",
          previousValue: "B",
          status: "updated",
          currentIndex: 1,
          previousIndex: null,
        },
        { value: "C", status: "equal", currentIndex: 2, previousIndex: 2 },
      ],
    });
  });

  it("ignores case when ignoreCase is true", () => {
    expect(
      getTextDiff("Hello World", "hello world", {
        ignoreCase: true,
        mode: "strict",
      }),
    ).toStrictEqual({
      type: "text",
      status: "equal",
      diff: [
        { value: "hello", status: "equal", currentIndex: 0, previousIndex: 0 },
        { value: "world", status: "equal", currentIndex: 1, previousIndex: 1 },
      ],
    });
  });

  it("ignores punctuation when ignorePunctuation is true", () => {
    expect(
      getTextDiff("Hello, world!", "Hello world", {
        ignorePunctuation: true,
        mode: "strict",
      }),
    ).toStrictEqual({
      type: "text",
      status: "equal",
      diff: [
        { value: "Hello", status: "equal", currentIndex: 0, previousIndex: 0 },
        { value: "world", status: "equal", currentIndex: 1, previousIndex: 1 },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by word", () => {
    expect(
      getTextDiff(
        "Solemnly he came and mounted the rounded gunrest.",
        "He, solemnly came and he mounted square gunrest.",
        { ignoreCase: true, separation: "word", mode: "strict" },
      ),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "He,", status: "added", currentIndex: 0, previousIndex: null },
        {
          value: "solemnly",
          status: "moved",
          currentIndex: 1,
          previousIndex: 0,
        },
        { value: "came", status: "equal", currentIndex: 2, previousIndex: 2 },
        { value: "and", status: "equal", currentIndex: 3, previousIndex: 3 },
        { value: "he", status: "moved", currentIndex: 4, previousIndex: 1 },
        {
          value: "mounted",
          status: "moved",
          currentIndex: 5,
          previousIndex: 4,
        },
        {
          value: "square",
          previousValue: "rounded",
          status: "updated",
          currentIndex: 6,
          previousIndex: null,
        },
        {
          value: "gunrest.",
          status: "equal",
          currentIndex: 7,
          previousIndex: 7,
        },
        {
          value: "the",
          status: "deleted",
          currentIndex: null,
          previousIndex: 5,
        },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by character", () => {
    expect(
      getTextDiff("abcdz", "xbcy", {
        separation: "character",
        mode: "strict",
      }),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "x",
          previousValue: "a",
          status: "updated",
          currentIndex: 0,
          previousIndex: null,
        },
        {
          value: "b",
          status: "equal",
          currentIndex: 1,
          previousIndex: 1,
        },
        {
          value: "c",
          status: "equal",
          currentIndex: 2,
          previousIndex: 2,
        },
        {
          value: "y",
          previousValue: "d",
          status: "updated",
          currentIndex: 3,
          previousIndex: null,
        },
        {
          value: "z",
          status: "deleted",
          currentIndex: null,
          previousIndex: 4,
        },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by sentence", () => {
    expect(
      getTextDiff(
        "A one. B two. C three. D four.",
        "B two. A ONE. C three. E five.",
        { separation: "sentence", mode: "strict", ignoreCase: true },
      ),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "B two.",
          status: "moved",
          currentIndex: 0,
          previousIndex: 1,
        },
        {
          value: "A ONE.",
          status: "moved",
          currentIndex: 1,
          previousIndex: 0,
        },
        {
          value: "C three.",
          status: "equal",
          currentIndex: 2,
          previousIndex: 2,
        },
        {
          value: "E five.",
          previousValue: "D four.",
          status: "updated",
          previousIndex: null,
          currentIndex: 3,
        },
      ],
    });
  });

  it("detects moves with duplicates", () => {
    expect(
      getTextDiff("A B C A B", "A B A B C", { mode: "strict" }),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "A", status: "equal", currentIndex: 0, previousIndex: 0 },
        { value: "B", status: "equal", currentIndex: 1, previousIndex: 1 },
        { value: "A", status: "moved", currentIndex: 2, previousIndex: 3 },
        { value: "B", status: "moved", currentIndex: 3, previousIndex: 4 },
        { value: "C", status: "moved", currentIndex: 4, previousIndex: 2 },
      ],
    });
  });
});
