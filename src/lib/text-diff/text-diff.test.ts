import { getTextDiff } from ".";

describe("getTextDiff - general", () => {
  it("returns all equal tokens when texts are identical", () => {
    expect(getTextDiff("A B C", "A B C")).toStrictEqual({
      type: "text",
      status: "equal",
      diff: [
        { value: "A", index: 0, previousIndex: 0, status: "equal" },
        { value: "B", index: 1, previousIndex: 1, status: "equal" },
        { value: "C", index: 2, previousIndex: 2, status: "equal" },
      ],
    });
  });

  it("marks all tokens as added when previous text is empty", () => {
    expect(getTextDiff("", "A B")).toStrictEqual({
      type: "text",
      status: "added",
      diff: [
        { value: "A", index: 0, previousIndex: null, status: "added" },
        { value: "B", index: 1, previousIndex: null, status: "added" },
      ],
    });
  });

  it("marks all tokens as deleted when current text is empty", () => {
    expect(getTextDiff("A B", "")).toStrictEqual({
      type: "text",
      status: "deleted",
      diff: [
        { value: "A", index: null, previousIndex: 0, status: "deleted" },
        { value: "B", index: null, previousIndex: 1, status: "deleted" },
      ],
    });
  });
});

describe("getTextDiff – normal accuracy", () => {
  it("merges delete + add at same position into updated", () => {
    expect(getTextDiff("A B C", "A X C")).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "A", index: 0, previousIndex: 0, status: "equal" },
        {
          value: "B",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "X",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        { value: "C", index: 2, previousIndex: 2, status: "equal" },
      ],
    });
  });

  it("represents reordering as delete + add in visual mode", () => {
    expect(getTextDiff("A B C A B", "A B A B C")).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "A", index: 0, previousIndex: 0, status: "equal" },
        { value: "B", index: 1, previousIndex: 1, status: "equal" },
        { value: "C", index: null, previousIndex: 2, status: "deleted" },
        { value: "A", index: 2, previousIndex: 3, status: "equal" },
        { value: "B", index: 3, previousIndex: 4, status: "equal" },
        { value: "C", index: 4, previousIndex: null, status: "added" },
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
        { value: "He,", index: 0, previousIndex: null, status: "added" },
        {
          value: "solemnly",
          index: 1,
          previousIndex: 0,
          status: "equal",
        },
        {
          value: "he",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        { value: "came", index: 2, previousIndex: 2, status: "equal" },
        { value: "and", index: 3, previousIndex: 3, status: "equal" },
        { value: "he", index: 4, previousIndex: null, status: "added" },
        {
          value: "mounted",
          index: 5,
          previousIndex: 4,
          status: "equal",
        },
        {
          value: "the",
          index: null,
          previousIndex: 5,
          status: "deleted",
        },
        {
          value: "rounded",
          index: null,
          previousIndex: 6,
          status: "deleted",
        },
        {
          value: "square",
          index: 6,
          previousIndex: null,
          status: "added",
        },
        {
          value: "gunrest.",
          index: 7,
          previousIndex: 7,
          status: "equal",
        },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by character", () => {
    expect(
      getTextDiff("abc", "xcy", {
        separation: "character",
        accuracy: "normal",
      }),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "a",
          index: null,
          previousIndex: 0,
          status: "deleted",
        },
        {
          value: "b",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "x",
          index: 0,
          previousIndex: null,
          status: "added",
        },
        { value: "c", index: 1, previousIndex: 2, status: "equal" },
        {
          value: "y",
          index: 2,
          previousIndex: null,
          status: "added",
        },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by sentence", () => {
    expect(
      getTextDiff(
        "Hello world. I like turtles. Goodbye moon.",
        "Hello world. I love turtles. Welcome sun.",
        { separation: "sentence", accuracy: "normal" },
      ),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "Hello world.",
          index: 0,
          previousIndex: 0,
          status: "equal",
        },
        {
          value: "I like turtles.",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "Goodbye moon.",
          index: null,
          previousIndex: 2,
          status: "deleted",
        },
        {
          value: "I love turtles.",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: "Welcome sun.",
          index: 2,
          previousIndex: null,
          status: "added",
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
        { value: "a", index: 0, previousIndex: 0, status: "equal" },
        {
          value: "b",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "x",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        { value: "c", index: 2, previousIndex: 2, status: "equal" },
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
          index: 0,
          previousIndex: 0,
          status: "equal",
        },
        {
          value: "How are you?",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "I'm fine.",
          index: 1,
          previousIndex: null,
          status: "added",
        },
      ],
    });
  });
});

describe("getTextDiff – high accuracy", () => {
  it("merges delete + add at same position into updated", () => {
    expect(getTextDiff("A B C", "A X C", { detectMoves: true })).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "A", status: "equal", index: 0, previousIndex: 0 },
        {
          value: "X",
          index: 1,
          previousValue: "B",
          previousIndex: null,
          status: "updated",
        },
        { value: "C", index: 2, previousIndex: 2, status: "equal" },
      ],
    });
  });

  it("ignores case when ignoreCase is true", () => {
    expect(
      getTextDiff("Hello World", "hello world", {
        ignoreCase: true,
        detectMoves: true,
      }),
    ).toStrictEqual({
      type: "text",
      status: "equal",
      diff: [
        { value: "hello", index: 0, previousIndex: 0, status: "equal" },
        { value: "world", index: 1, previousIndex: 1, status: "equal" },
      ],
    });
  });

  it("ignores punctuation when ignorePunctuation is true", () => {
    expect(
      getTextDiff("Hello, world!", "Hello world", {
        ignorePunctuation: true,
        detectMoves: true,
      }),
    ).toStrictEqual({
      type: "text",
      status: "equal",
      diff: [
        { value: "Hello", index: 0, previousIndex: 0, status: "equal" },
        { value: "world", index: 1, previousIndex: 1, status: "equal" },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by word", () => {
    expect(
      getTextDiff(
        "Solemnly he came and mounted the rounded gunrest.",
        "He, solemnly came and he mounted square gunrest.",
        { ignoreCase: true, separation: "word", detectMoves: true },
      ),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "He,", index: 0, previousIndex: null, status: "added" },
        {
          value: "solemnly",
          index: 1,
          previousIndex: 0,
          status: "moved",
        },
        { value: "came", index: 2, previousIndex: 2, status: "equal" },
        { value: "and", index: 3, previousIndex: 3, status: "equal" },
        { value: "he", index: 4, previousIndex: 1, status: "moved" },
        {
          value: "mounted",
          index: 5,
          previousIndex: 4,
          status: "moved",
        },
        {
          value: "square",
          index: 6,
          previousValue: "rounded",
          previousIndex: null,
          status: "updated",
        },
        {
          value: "gunrest.",
          index: 7,
          previousIndex: 7,
          status: "equal",
        },
        {
          value: "the",
          index: null,
          previousIndex: 5,
          status: "deleted",
        },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by character", () => {
    expect(
      getTextDiff("abcdz", "xbcy", {
        separation: "character",
        detectMoves: true,
      }),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "x",
          index: 0,
          previousValue: "a",
          previousIndex: null,
          status: "updated",
        },
        {
          value: "b",
          index: 1,
          previousIndex: 1,
          status: "equal",
        },
        {
          value: "c",
          index: 2,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: "y",
          index: 3,
          previousValue: "d",
          previousIndex: null,
          status: "updated",
        },
        {
          value: "z",
          index: null,
          previousIndex: 4,
          status: "deleted",
        },
      ],
    });
  });

  it("handles moves, updates, adds and deletes correctly - by sentence", () => {
    expect(
      getTextDiff(
        "A one. B two. C three. D four.",
        "B two. A ONE. C three. E five.",
        { separation: "sentence", detectMoves: true, ignoreCase: true },
      ),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "B two.",
          index: 0,
          previousIndex: 1,
          status: "moved",
        },
        {
          value: "A ONE.",
          index: 1,
          previousIndex: 0,
          status: "moved",
        },
        {
          value: "C three.",
          index: 2,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: "E five.",
          index: 3,
          previousValue: "D four.",
          previousIndex: null,
          status: "updated",
        },
      ],
    });
  });

  it("detects moves with duplicates", () => {
    expect(
      getTextDiff("A B C A B", "A B A B C", { detectMoves: true }),
    ).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        { value: "A", index: 0, previousIndex: 0, status: "equal" },
        { value: "B", index: 1, previousIndex: 1, status: "equal" },
        { value: "A", index: 2, previousIndex: 3, status: "moved" },
        { value: "B", index: 3, previousIndex: 4, status: "moved" },
        { value: "C", index: 4, previousIndex: 2, status: "moved" },
      ],
    });
  });
});
