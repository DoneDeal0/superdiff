import { tokenizeNormalText } from "./normal";

describe("tokenizeText", () => {
  const base = "hello wrld! It's a  great day... A wonderful day! Yeah.";

  it("splits text into sentences", () => {
    const tokens = tokenizeNormalText(base, { separation: "sentence" });

    expect(tokens).toEqual([
      { value: "hello wrld!", normalizedValue: "hello wrld!", index: 0 },
      {
        value: "It's a  great day...",
        normalizedValue: "It's a  great day...",
        index: 1,
      },
      {
        value: "A wonderful day!",
        normalizedValue: "A wonderful day!",
        index: 2,
      },
      { value: "Yeah.", normalizedValue: "Yeah.", index: 3 },
    ]);
  });

  it("splits text into words and merges punctuation", () => {
    const tokens = tokenizeNormalText(base, { separation: "word" });

    expect(tokens).toEqual([
      { value: "hello", normalizedValue: "hello", index: 0 },
      { value: "wrld!", normalizedValue: "wrld!", index: 1 },
      { value: "It's", normalizedValue: "It's", index: 2 },
      { value: "a", normalizedValue: "a", index: 3 },
      { value: "great", normalizedValue: "great", index: 4 },
      { value: "day...", normalizedValue: "day...", index: 5 },
      { value: "A", normalizedValue: "A", index: 6 },
      { value: "wonderful", normalizedValue: "wonderful", index: 7 },
      { value: "day!", normalizedValue: "day!", index: 8 },
      { value: "Yeah.", normalizedValue: "Yeah.", index: 9 },
    ]);
  });

  it("splits text into characters", () => {
    const tokens = tokenizeNormalText("abc!", { separation: "character" });

    expect(tokens).toEqual([
      { value: "a", normalizedValue: "a", index: 0 },
      { value: "b", normalizedValue: "b", index: 1 },
      { value: "c", normalizedValue: "c", index: 2 },
      { value: "!", normalizedValue: "!", index: 3 },
    ]);
  });

  it("splits text by words when separation type is unknown", () => {
    const tokens = tokenizeNormalText("hello   world");

    expect(tokens).toEqual([
      { value: "hello", normalizedValue: "hello", index: 0 },
      { value: "world", normalizedValue: "world", index: 1 },
    ]);
  });

  it("normalizes tokens by lowercasing when ignoreCase is true", () => {
    const tokens = tokenizeNormalText("Hello WORLD!", {
      separation: "word",
      ignoreCase: true,
    });

    expect(tokens).toEqual([
      { value: "Hello", normalizedValue: "hello", index: 0 },
      { value: "WORLD!", normalizedValue: "world!", index: 1 },
    ]);
  });

  it("removes punctuation in normalizedValue when ignorePunctuation is true", () => {
    const tokens = tokenizeNormalText("hello world!", {
      separation: "word",
      ignorePunctuation: true,
    });

    expect(tokens).toEqual([
      { value: "hello", normalizedValue: "hello", index: 0 },
      { value: "world!", normalizedValue: "world", index: 1 },
    ]);
  });

  it("applies both ignoreCase and ignorePunctuation", () => {
    const tokens = tokenizeNormalText("Hello WORLD!", {
      separation: "word",
      ignoreCase: true,
      ignorePunctuation: true,
    });

    expect(tokens).toEqual([
      { value: "Hello", normalizedValue: "hello", index: 0 },
      { value: "WORLD!", normalizedValue: "world", index: 1 },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(tokenizeNormalText("", { separation: "word" })).toEqual([]);
    expect(tokenizeNormalText(null, { separation: "word" })).toEqual([]);
    expect(tokenizeNormalText(undefined, { separation: "word" })).toEqual([]);
  });

  it("handles locale-specific segmentation (Japanese)", () => {
    const tokens = tokenizeNormalText("今日はいい天気ですね。", {
      separation: "sentence",
      locale: "ja",
    });

    expect(tokens).toEqual([
      {
        value: "今日はいい天気ですね。",
        normalizedValue: "今日はいい天気ですね。",
        index: 0,
      },
    ]);
  });

  it("trims extra spacing in sentences", () => {
    const tokens = tokenizeNormalText("  Hello world!   This   is fine. ", {
      separation: "sentence",
    });

    expect(tokens).toEqual([
      {
        value: "Hello world!",
        normalizedValue: "Hello world!",
        index: 0,
      },
      {
        value: "This   is fine.",
        normalizedValue: "This   is fine.",
        index: 1,
      },
    ]);
  });

  it("merges multiple punctuation marks", () => {
    const tokens = tokenizeNormalText("Wait!!! Really??", {
      separation: "word",
    });
    expect(tokens).toEqual([
      { value: "Wait!!!", normalizedValue: "Wait!!!", index: 0 },
      { value: "Really??", normalizedValue: "Really??", index: 1 },
    ]);
  });

  it("keeps emojis as standalone tokens", () => {
    const tokens = tokenizeNormalText("Hello 😊 world!", {
      separation: "word",
    });
    expect(tokens).toEqual([
      { value: "Hello", normalizedValue: "Hello", index: 0 },
      { value: "😊", normalizedValue: "😊", index: 1 },
      { value: "world!", normalizedValue: "world!", index: 2 },
    ]);
  });

  it("handles numbers and punctuation", () => {
    const tokens = tokenizeNormalText("Version 2.0 is out!", {
      separation: "word",
    });

    expect(tokens).toEqual([
      { value: "Version", normalizedValue: "Version", index: 0 },
      { value: "2.0", normalizedValue: "2.0", index: 1 },
      { value: "is", normalizedValue: "is", index: 2 },
      { value: "out!", normalizedValue: "out!", index: 3 },
    ]);
  });

  it("handles mixed scripts", () => {
    const tokens = tokenizeNormalText("Hello 世界!", { separation: "word" });

    expect(tokens).toEqual([
      { value: "Hello", normalizedValue: "Hello", index: 0 },
      { value: "世界!", normalizedValue: "世界!", index: 1 },
    ]);
  });

  it("does not merge symbols that are not punctuation", () => {
    const tokens = tokenizeNormalText("hello + world", { separation: "word" });

    expect(tokens).toEqual([
      { value: "hello", normalizedValue: "hello", index: 0 },
      { value: "+", normalizedValue: "+", index: 1 },
      { value: "world", normalizedValue: "world", index: 2 },
    ]);
  });

  it("handles unicode punctuation like em-dash and ellipsis", () => {
    const tokens = tokenizeNormalText("Is Jean-Claude cool?", {
      separation: "word",
    });
    expect(tokens).toEqual([
      { value: "Is", normalizedValue: "Is", index: 0 },
      { value: "Jean-Claude", normalizedValue: "Jean-Claude", index: 1 },
      { value: "cool?", normalizedValue: "cool?", index: 2 },
    ]);
  });

  it("ignorePunctuation removes unicode punctuation", () => {
    const tokens = tokenizeNormalText("Wait—really…?", {
      separation: "word",
      ignorePunctuation: true,
    });

    expect(tokens).toEqual([
      {
        value: "Wait—really…?",
        normalizedValue: "Waitreally",
        index: 0,
      },
    ]);
  });
});
