import { getTextDiff } from ".";

describe("getTextDiff - general", () => {
  it("return equal when both texts are empty", () => {
    expect(getTextDiff("", "")).toStrictEqual({ type: "text", status: "equal", diff: [] })
    expect(getTextDiff(null, undefined)).toStrictEqual({ type: "text", status: "equal", diff: [] })
  })
  // CHARACTERS
  it("character - returns equal when texts are identical", () => {
    const result = {
      type: "text",
      status: "equal",
      diff: [
        { value: "A", index: 0, previousIndex: 0, status: "equal" },
        { value: "B", index: 1, previousIndex: 1, status: "equal" },
        { value: "C", index: 2, previousIndex: 2, status: "equal" },
      ],
    }
    expect(getTextDiff("ABC", "ABC", { separation: "character", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff("ABC", "ABC", { separation: "character", accuracy: "high" })).toStrictEqual(result);
  });
  it("character - return added when previous text is empty", () => {
    const result = {
      type: "text",
      status: "added",
      diff: [
        { value: "A", index: 0, previousIndex: null, status: "added" },
        { value: "B", index: 1, previousIndex: null, status: "added" },
      ],
    }
    expect(getTextDiff("", "AB", { separation: "character", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff("", "AB", { separation: "character", accuracy: "high" })).toStrictEqual(result);
  });
  it("character - return deleted when current text is empty", () => {
    const result = {
      type: "text",
      status: "deleted",
      diff: [
        { value: "A", index: null, previousIndex: 0, status: "deleted" },
        { value: "B", index: null, previousIndex: 1, status: "deleted" },
      ],
    }
    expect(getTextDiff("AB", "", { separation: "character", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff("AB", "", { separation: "character", accuracy: "high" })).toStrictEqual(result);
  });
  // WORDS
  it("word - returns equal when texts are identical", () => {
    const result = {
      type: "text",
      status: "equal",
      diff: [
        { value: "Anthem", index: 0, previousIndex: 0, status: "equal" },
        { value: "Boat", index: 1, previousIndex: 1, status: "equal" },
        { value: "Chill", index: 2, previousIndex: 2, status: "equal" },
      ],
    }
    expect(getTextDiff("Anthem Boat Chill", "Anthem Boat Chill", { separation: "word", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff("Anthem Boat Chill", "Anthem Boat Chill", { separation: "word", accuracy: "high" })).toStrictEqual(result);
  });
  it("word - return added when previous text is empty", () => {
    const result = {
      type: "text",
      status: "added",
      diff: [
        { value: "Anthem", index: 0, previousIndex: null, status: "added" },
        { value: "boat", index: 1, previousIndex: null, status: "added" },
      ],
    }
    expect(getTextDiff("", "Anthem boat", { separation: "word", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff("", "Anthem boat", { separation: "word", accuracy: "high" })).toStrictEqual(result);
  });
  it("word - return deleted when current text is empty", () => {
    const result = {
      type: "text",
      status: "deleted",
      diff: [
        { value: "Anthem", index: null, previousIndex: 0, status: "deleted" },
        { value: "boat", index: null, previousIndex: 1, status: "deleted" },
      ],
    }
    expect(getTextDiff("Anthem boat", "", { separation: "word", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff("Anthem boat", "", { separation: "word", accuracy: "high" })).toStrictEqual(result);
  });
  // SENTENCES
  it("sentence - returns equal when texts are identical", () => {
    const result = {
      type: "text",
      status: "equal",
      diff: [
        { value: "First sentence.", index: 0, previousIndex: 0, status: "equal" },
        { value: "Second one here!", index: 1, previousIndex: 1, status: "equal" },
        { value: "And a third?", index: 2, previousIndex: 2, status: "equal" },
        { value: "Yes.", index: 3, previousIndex: 3, status: "equal" },
      ],
    }
    expect(getTextDiff("First sentence. Second one here! And a third? Yes.", "First sentence. Second one here! And a third? Yes.", { separation: "sentence", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff("First sentence. Second one here! And a third? Yes.", "First sentence. Second one here! And a third? Yes.", { separation: "sentence", accuracy: "high" })).toStrictEqual(result);
  });
  it("sentence - return added when previous text is empty", () => {
    const result = {
      type: "text",
      status: "added",
      diff: [
        { value: "First sentence.", index: 0, previousIndex: null, status: "added" },
        { value: "Second one here!", index: 1, previousIndex: null, status: "added" },
        { value: "And a third?", index: 2, previousIndex: null, status: "added" },
        { value: "Yes.", index: 3, previousIndex: null, status: "added" },
      ],
    }
    expect(getTextDiff("", "First sentence. Second one here! And a third? Yes.", { separation: "sentence", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff("", "First sentence. Second one here! And a third? Yes.", { separation: "sentence", accuracy: "high" })).toStrictEqual(result);
  });
  it("sentence - return deleted when current text is empty", () => {
    const result = {
      type: "text",
      status: "deleted",
      diff: [
        { value: "First sentence.", index: null, previousIndex: 0, status: "deleted" },
        { value: "Second one here!", index: null, previousIndex: 1, status: "deleted" },
        { value: "And a third?", index: null, previousIndex: 2, status: "deleted" },
        { value: "Yes.", index: null, previousIndex: 3, status: "deleted" },
      ],
    }
    expect(getTextDiff("First sentence. Second one here! And a third? Yes.", "", { separation: "sentence", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff("First sentence. Second one here! And a third? Yes.", "", { separation: "sentence", accuracy: "high" })).toStrictEqual(result);
  });
});

describe("getTextDiff – without moves detection", () => {
  // CHARACTERS
  it("character - no options", () => {
    const result = {
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
    }
    expect(
      getTextDiff("abc", "axc", { separation: "character", accuracy: "normal" }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("abc", "axc", { separation: "character", accuracy: "high" }),
    ).toStrictEqual(result);
  });
  it("character - ignore casing", () => {
    const result = {
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
        { value: "C", index: 2, previousIndex: 2, status: "equal" },
      ],
    }
    expect(
      getTextDiff("Abc", "axC", { separation: "character", ignoreCase: true, accuracy: "normal" }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("Abc", "axC", { separation: "character", ignoreCase: true, accuracy: "high" }),
    ).toStrictEqual(result);
  });
  it("character - ignore punctuation", () => {
    const result = {
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
    }
    expect(
      getTextDiff("a;(b?c!", "a,xc", {
        separation: "character",
        ignorePunctuation: true,
        accuracy: "normal"
      }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("a;(b?c!", "a,xc", {
        separation: "character",
        ignorePunctuation: true,
        accuracy: "high"
      }),
    ).toStrictEqual(result);
  });
  it("character - ignore punctuation and casing", () => {
    const result = {
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
        { value: "C", index: 2, previousIndex: 2, status: "equal" },
      ],
    }
    expect(
      getTextDiff("A;(b?c!", "a,xC", {
        separation: "character",
        ignorePunctuation: true,
        ignoreCase: true,
        accuracy: "normal"
      }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("A;(b?c!", "a,xC", {
        separation: "character",
        ignorePunctuation: true,
        ignoreCase: true,
        accuracy: "high"
      }),
    ).toStrictEqual(result);
  });
  it("character - handles extra spaces", () => {
    const result = {
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
    }
    expect(
      getTextDiff("ab c", "a x c", { separation: "character", accuracy: "normal" }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("ab c", "a x c", { separation: "character", accuracy: "high" }),
    ).toStrictEqual(result);
  });
  it("character - handles emojis", () => {
    const result = {
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
        { value: "😂", index: 2, previousIndex: 2, status: "equal" },
        { value: "c", index: 3, previousIndex: 3, status: "equal" },
        { value: "😎", index: 4, previousIndex: null, status: "added" },
      ],
    }
    expect(
      getTextDiff("ab😂c", "ax😂c😎", { separation: "character", accuracy: "normal" }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("ab😂c", "ax😂c😎", { separation: "character", accuracy: "high" }),
    ).toStrictEqual(result);
  });
  it("character - a moved character breaking a sequence appears as deleted + updated", () => {
    const result = {
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
    }
    expect(
      getTextDiff("ABCAB", "ABABC", { separation: "character", accuracy: "normal" }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("ABCAB", "ABABC", { separation: "character", accuracy: "high" }),
    ).toStrictEqual(result);
  });
  it("character - handles duplicates", () => {
    const result = {
      type: "text",
      status: "updated",
      diff: [
        { value: "A", index: 0, previousIndex: 0, status: "equal" },
        { value: "A", index: null, previousIndex: 1, status: "deleted" },
        { value: "B", index: 1, previousIndex: 2, status: "equal" },
        { value: "A", index: 2, previousIndex: 3, status: "equal" },
        { value: "A", index: 3, previousIndex: null, status: "added" },
        { value: "C", index: 4, previousIndex: null, status: "added" },
      ],
    }
    expect(
      getTextDiff("AABA", "ABAAC", { separation: "character", accuracy: "normal" }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("AABA", "ABAAC", { separation: "character", accuracy: "high" }),
    ).toStrictEqual(result);
  });
  it("character - handles moves, equality, updates, adds and deletes correctly", () => {
    const result = {
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
    }
    expect(
      getTextDiff("abc", "xcy", { separation: "character", accuracy: "normal" }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("abc", "xcy", { separation: "character", accuracy: "high" }),
    ).toStrictEqual(result);
  });
  it("character - handles CJK (without locale)", () => {
    const prev = "我是中国人";
    const curr = "我是日本人心";
    const result = {
      "type": "text",
      "status": "updated",
      "diff": [
        {
          "value": "我",
          "index": 0,
          "previousIndex": 0,
          "status": "equal"
        },
        {
          "value": "是",
          "index": 1,
          "previousIndex": 1,
          "status": "equal"
        },
        {
          "value": "中",
          "index": null,
          "previousIndex": 2,
          "status": "deleted"
        },
        {
          "value": "国",
          "index": null,
          "previousIndex": 3,
          "status": "deleted"
        },
        {
          "value": "日",
          "index": 2,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "本",
          "index": 3,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "人",
          "index": 4,
          "previousIndex": 4,
          "status": "equal"
        },
        {
          "value": "心",
          "index": 5,
          "previousIndex": null,
          "status": "added"
        }
      ]
    }
    expect(getTextDiff(prev, curr, { separation: "character", accuracy: "normal" })).toStrictEqual(result);
    expect(getTextDiff(prev, curr, { separation: "character", accuracy: "high" })).toStrictEqual(result);
  });
  it("character - handles CJK (with locale)", () => {
    const prev = "我是中国人";
    const curr = "我是日本人心";
    const result = {
      "type": "text",
      "status": "updated",
      "diff": [
        {
          "value": "我",
          "index": 0,
          "previousIndex": 0,
          "status": "equal"
        },
        {
          "value": "是",
          "index": 1,
          "previousIndex": 1,
          "status": "equal"
        },
        {
          "value": "中",
          "index": null,
          "previousIndex": 2,
          "status": "deleted"
        },
        {
          "value": "国",
          "index": null,
          "previousIndex": 3,
          "status": "deleted"
        },
        {
          "value": "日",
          "index": 2,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "本",
          "index": 3,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "人",
          "index": 4,
          "previousIndex": 4,
          "status": "equal"
        },
        {
          "value": "心",
          "index": 5,
          "previousIndex": null,
          "status": "added"
        }
      ]
    }
    expect(getTextDiff(prev, curr, { separation: "character", accuracy: "high", locale: "zh" })).toStrictEqual(result);
  });
  // WORDS
  it("word - no options", () => {
    const result = {
      type: "text",
      status: "updated",
      diff: [
        {
          value: "Solemnly",
          index: null,
          previousIndex: 0,
          status: "deleted",
        },
        {
          value: "he",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "He,",
          index: 0,
          previousIndex: null,
          status: "added",
        },
        {
          value: "solemnly",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: "came",
          index: 2,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: "and",
          index: 3,
          previousIndex: 3,
          status: "equal",
        },
        {
          value: "he",
          index: 4,
          previousIndex: null,
          status: "added",
        },
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
    }
    expect(
      getTextDiff(
        "Solemnly he came and mounted the rounded gunrest.",
        "He, solemnly came and he mounted square gunrest.",
        { separation: "word", accuracy: "normal" },
      ),
    ).toStrictEqual(result);
    expect(
      getTextDiff(
        "Solemnly he came and mounted the rounded gunrest.",
        "He, solemnly came and he mounted square gunrest.",
        { separation: "word", accuracy: "high" },
      ),
    ).toStrictEqual(result);
  });
  it("word - ignore casing", () => {
    const result = {
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
    }
    expect(
      getTextDiff(
        "Solemnly he came and mounted the rounded gunrest.",
        "He, solemnly came and he mounted square gunrest.",
        { ignoreCase: true, separation: "word", accuracy: "normal" },
      ),
    ).toStrictEqual(result);
    expect(
      getTextDiff(
        "Solemnly he came and mounted the rounded gunrest.",
        "He, solemnly came and he mounted square gunrest.",
        { ignoreCase: true, separation: "word", accuracy: "high" },
      ),
    ).toStrictEqual(result);
  });
  it("word - ignore punctuation", () => {
    const result = {
      type: "text",
      status: "updated",
      diff: [
        {
          value: "Solemnly",
          index: null,
          previousIndex: 0,
          status: "deleted",
        },
        {
          value: "he(!",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "He,",
          index: 0,
          previousIndex: null,
          status: "added",
        },
        {
          value: "solemnly",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: "came",
          index: 2,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: "and;",
          index: 3,
          previousIndex: 3,
          status: "equal",
        },
        {
          value: "he",
          index: 4,
          previousIndex: null,
          status: "added",
        },
        {
          value: "mounted:?!",
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
    }
    expect(
      getTextDiff(
        "Solemnly he(! came and mounted the rounded gunrest.",
        "He, solemnly came and; he mounted:?! square gunrest.",
        { ignorePunctuation: true, separation: "word", accuracy: "normal" },
      ),
    ).toStrictEqual(result);
    expect(
      getTextDiff(
        "Solemnly he(! came and mounted the rounded gunrest.",
        "He, solemnly came and; he mounted:?! square gunrest.",
        { ignorePunctuation: true, separation: "word", accuracy: "high" },
      ),
    ).toStrictEqual(result);
  });
  it("word - ignore punctuation and casing", () => {
    const result = {
      type: "text",
      status: "updated",
      diff: [
        {
          value: "Solemnly",
          index: null,
          previousIndex: 0,
          status: "deleted",
        },
        {
          value: "He,",
          index: 0,
          previousIndex: 1,
          status: "equal",
        },
        {
          value: "solemnly",
          index: 1,
          previousIndex: null,
          status: "added",
        },
        {
          value: "came",
          index: 2,
          previousIndex: 2,
          status: "equal",
        },
        {
          value: "and",
          index: 3,
          previousIndex: 3,
          status: "equal",
        },
        {
          value: "he",
          index: 4,
          previousIndex: null,
          status: "added",
        },
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
    }
    expect(
      getTextDiff(
        "Solemnly he came and mounted the rounded gunrest.",
        "He, solemnly came and he mounted square gunrest.",
        { ignorePunctuation: true, ignoreCase: true, separation: "word", accuracy: "normal" },
      ),
    ).toStrictEqual(result);
    expect(
      getTextDiff(
        "Solemnly he came and mounted the rounded gunrest.",
        "He, solemnly came and he mounted square gunrest.",
        { ignorePunctuation: true, ignoreCase: true, separation: "word", accuracy: "high" },
      ),
    ).toStrictEqual(result);
  });
  it("word - handles extra spaces", () => {
    const result = {
      type: "text",
      status: "updated",
      diff: [
        {
          value: "Hello",
          index: 0,
          previousIndex: 0,
          "status": "equal"
        },
        {
          "value": "beautiful",
          index: 1,
          previousIndex: null,
          "status": "added"
        },
        {
          "value": "world",
          index: 2,
          previousIndex: 1,
          "status": "equal"
        },
        {
          "value": "world",
          index: null,
          previousIndex: 2,
          "status": "deleted"
        }
      ]
    }
    const prev = "Hello   world   world";
    const curr = "Hello beautiful   world";

    expect(getTextDiff(prev, curr, { separation: "word", accuracy: "normal" }))
      .toStrictEqual(result);
    expect(getTextDiff(prev, curr, { separation: "word", accuracy: "high" }))
      .toStrictEqual(result);
  });
  it("word - handles emojis", () => {
    const result = {
      type: "text",
      status: "updated",
      diff: [
        { value: "Hello", index: 0, previousIndex: 0, status: "equal" },
        { value: "😀", index: null, previousIndex: 1, status: "deleted" },
        { value: "😂", index: 1, previousIndex: null, status: "added" },
        { value: "world", index: 2, previousIndex: 2, status: "equal" },
      ],
    };

    const prev = "Hello 😀 world";
    const curr = "Hello 😂 world";

    expect(getTextDiff(prev, curr, { separation: "word", accuracy: "normal" }))
      .toStrictEqual(result);
    expect(getTextDiff(prev, curr, { separation: "word", accuracy: "high" }))
      .toStrictEqual(result);
  });
  it("word - a moved word breaking a sequence appears as added + deleted", () => {
    const prev = "I'm writing so much tests"
    const curr = "I'm writing tests so much"
    const result = {
      type: "text",
      status: "updated",
      diff: [
        { value: "I'm", index: 0, previousIndex: 0, status: "equal" },
        { value: "writing", index: 1, previousIndex: 1, status: "equal" },
        { value: "tests", index: 2, previousIndex: null, status: "added" },
        { value: "so", index: 3, previousIndex: 2, status: "equal" },
        { value: "much", index: 4, previousIndex: 3, status: "equal" },
        { value: "tests", index: null, previousIndex: 4, status: "deleted" },
      ]
    }
    expect(
      getTextDiff(prev, curr, { separation: "word", accuracy: "normal" }),
    ).toStrictEqual(result);
    expect(
      getTextDiff(prev, curr, { separation: "word", accuracy: "high" }),
    ).toStrictEqual(result);
  })
  it("word - handles duplicates", () => {
    const prev = "cat dog cat bird";
    const curr = "cat bird cat dog";
    const result = {
      type: "text",
      status: "updated",
      diff: [
        { value: 'cat', index: 0, previousIndex: 0, status: 'equal' },
        { value: 'dog', index: null, previousIndex: 1, status: 'deleted' },
        { value: 'cat', index: null, previousIndex: 2, status: 'deleted' },
        { value: 'bird', index: 1, previousIndex: 3, status: 'equal' },
        { value: 'cat', index: 2, previousIndex: null, status: 'added' },
        { value: 'dog', index: 3, previousIndex: null, status: 'added' }
      ],
    };
    expect(getTextDiff(prev, curr, { separation: "word", accuracy: "normal" })).toStrictEqual(result);
  });
  it("word - handles moves, equality, updates, adds and deletes correctly", () => {
    const result = {
      type: "text",
      status: "updated",
      diff: [
        {
          value: "anthem",
          index: null,
          previousIndex: 0,
          status: "deleted",
        },
        {
          value: "boat",
          index: null,
          previousIndex: 1,
          status: "deleted",
        },
        {
          value: "xylophone",
          index: 0,
          previousIndex: null,
          status: "added",
        },
        { value: "chill", index: 1, previousIndex: 2, status: "equal" },
        {
          value: "yolo",
          index: 2,
          previousIndex: null,
          status: "added",
        },
      ],
    }
    expect(
      getTextDiff("anthem boat chill", "xylophone chill yolo", { separation: "word", accuracy: "normal" }),
    ).toStrictEqual(result);
    expect(
      getTextDiff("anthem boat chill", "xylophone chill yolo", { separation: "word", accuracy: "high" }),
    ).toStrictEqual(result);
  });
  it("word - handles CJK (without locale)", () => {
    const prev = "我是中国人今天很开心";
    const curr = "我是日本人今天非常开心";

    const result = {
      "type": "text",
      "status": "updated",
      "diff": [
        {
          "value": "我是",
          "index": 0,
          "previousIndex": 0,
          "status": "equal"
        },
        {
          "value": "中国人",
          "index": null,
          "previousIndex": 1,
          "status": "deleted"
        },
        {
          "value": "日本人",
          "index": 1,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "今天",
          "index": 2,
          "previousIndex": 2,
          "status": "equal"
        },
        {
          "value": "很",
          "index": null,
          "previousIndex": 3,
          "status": "deleted"
        },
        {
          "value": "非常",
          "index": 3,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "开心",
          "index": 4,
          "previousIndex": 4,
          "status": "equal"
        }
      ]
    }

    expect(getTextDiff(prev, curr, { separation: "word", accuracy: "normal" })).toStrictEqual({
      type: "text",
      status: "updated",
      diff: [
        {
          value: "我是中国人今天很开心",
          index: null,
          previousIndex: 0,
          status: "deleted"
        },
        {
          value: "我是日本人今天非常开心",
          index: 0,
          previousIndex: null,
          status: "added"
        }
      ]
    });
    expect(getTextDiff(prev, curr, { separation: "word", accuracy: "high" }))
      .toStrictEqual(result);

  });
  it("word - handles CJK (with locale)", () => {
    const prevChinese = "我是中国人今天很开心";
    const currChinese = "我是日本人今天非常开心";

    const prevThai = "ผมไปตลาดเมื่อวานนี้";
    const currThai = "ฉันไปตลาดเมื่อเช้านี้";

    const resultChinese = {
      "type": "text",
      "status": "updated",
      "diff": [
        {
          "value": "我是",
          "index": 0,
          "previousIndex": 0,
          "status": "equal"
        },
        {
          "value": "中国人",
          "index": null,
          "previousIndex": 1,
          "status": "deleted"
        },
        {
          "value": "日本人",
          "index": 1,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "今天",
          "index": 2,
          "previousIndex": 2,
          "status": "equal"
        },
        {
          "value": "很",
          "index": null,
          "previousIndex": 3,
          "status": "deleted"
        },
        {
          "value": "非常",
          "index": 3,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "开心",
          "index": 4,
          "previousIndex": 4,
          "status": "equal"
        }
      ]
    }
    const resultThai = {
      "type": "text",
      "status": "updated",
      "diff": [
        {
          "value": "ผม",
          "index": null,
          "previousIndex": 0,
          "status": "deleted"
        },
        {
          "value": "ฉัน",
          "index": 0,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "ไป",
          "index": 1,
          "previousIndex": 1,
          "status": "equal"
        },
        {
          "value": "ตลาด",
          "index": 2,
          "previousIndex": 2,
          "status": "equal"
        },
        {
          "value": "เมื่อ",
          "index": 3,
          "previousIndex": 3,
          "status": "equal"
        },
        {
          "value": "วาน",
          "index": null,
          "previousIndex": 4,
          "status": "deleted"
        },
        {
          "value": "เช้า",
          "index": 4,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "นี้",
          "index": 5,
          "previousIndex": 5,
          "status": "equal"
        }
      ]
    }
    expect(getTextDiff(prevChinese, currChinese, { separation: "word", accuracy: "high", locale: "zh" }))
      .toStrictEqual(resultChinese);
    expect(getTextDiff(prevThai, currThai, { separation: "word", accuracy: "high", locale: "th" }))
      .toStrictEqual(resultThai);
  });
  // SENTENCES
  it("sentence - no options", () => {
    const result = {
      "type": "text",
      "status": "updated",
      "diff": [
        {
          "value": "Solemnly he mounted the rounded gunrest.",
          "index": null,
          "previousIndex": 0,
          "status": "deleted"
        },
        {
          "value": "It was glorious...",
          "index": null,
          "previousIndex": 1,
          "status": "deleted"
        },
        {
          "value": "Solemnly he mounted the square gunrest.",
          "index": 0,
          "previousIndex": null,
          "status": "added"
        },
        {
          "value": "Then, he jumped on the boat!",
          "index": 1,
          "previousIndex": 2,
          "status": "equal"
        },
        {
          "value": "It was glorious...",
          "index": 2,
          "previousIndex": null,
          "status": "added"
        }
      ]
    }
    expect(
      getTextDiff(
        "Solemnly he mounted the rounded gunrest. It was glorious... Then, he jumped on the boat!",
        "Solemnly he mounted the square gunrest. Then, he jumped on the boat! It was glorious... ",
        { separation: "sentence", accuracy: "normal" },
      ),
    ).toStrictEqual(result);
    expect(
      getTextDiff(
        "Solemnly he mounted the rounded gunrest. It was glorious... Then, he jumped on the boat!",
        "Solemnly he mounted the square gunrest. Then, he jumped on the boat! It was glorious... ",
        { separation: "sentence", accuracy: "high" },
      ),
    ).toStrictEqual(result);
  });
  it("sentences - handles moves, updates, adds and deletes correctly - by sentence", () => {
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
  it("sentences - handles sentence separation", () => {
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
  // it("sentences - handles abbreviation (Mr. Dr. etc.) without breaking", () => {
  //   const prev = "Mr. Smith went home. Dr. Jones called.";
  //   const curr = "Mr. Smith went home. Mrs. Jones called.";
  //   expect(getTextDiff(prev, curr, { separation: "sentence", accuracy: "high" })).toStrictEqual({
  //     type: "text",
  //     status: "updated",
  //     diff: [
  //       { value: "Mr. Smith went home.", index: 0, previousIndex: 0, status: "equal" },
  //       { value: "Dr. Jones called.", index: null, previousIndex: 1, status: "deleted" },
  //       { value: "Mrs. Jones called.", index: 1, previousIndex: null, status: "added" },
  //     ],
  //   });
  // });
  // it("sentences - punctuation variations don't break equality if ignorePunctuation", () => {
  //   const prev = "Hello world!! This is fun...";
  //   const curr = "Hello world. This is fun?";
  //   expect(
  //     getTextDiff(prev, curr, {
  //       separation: "sentence",
  //       ignorePunctuation: true,
  //     }),
  //   ).toStrictEqual({
  //     type: "text",
  //     status: "updated",
  //     diff: [
  //       { value: "Hello world!!", index: 0, previousIndex: 0, status: "equal" },
  //       { value: "This is fun...", index: null, previousIndex: 1, status: "deleted" },
  //       { value: "This is fun?", index: 1, previousIndex: null, status: "added" },
  //     ],
  //   });
  // });
});

describe("getTextDiff – with moves detection", () => {
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
