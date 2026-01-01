import { tokenizeText } from ".";

describe("tokenizeText", () => {
  const base = "hello wrld! It's a  great day... A wonderful day! Yeah.";

  it("splits text into sentences", () => {
    const tokens = tokenizeText(base, { separation: "sentence" });

    expect(tokens).toEqual([
      { value: "hello wrld!", normalizedValue: "hello wrld!", currentIndex: 0 },
      {
        value: "It's a  great day...",
        normalizedValue: "It's a  great day...",
        currentIndex: 1,
      },
      {
        value: "A wonderful day!",
        normalizedValue: "A wonderful day!",
        currentIndex: 2,
      },
      { value: "Yeah.", normalizedValue: "Yeah.", currentIndex: 3 },
    ]);
  });

  it("splits text into words and merges punctuation", () => {
    const tokens = tokenizeText(base, { separation: "word" });

    expect(tokens).toEqual([
      { value: "hello", normalizedValue: "hello", currentIndex: 0 },
      { value: "wrld!", normalizedValue: "wrld!", currentIndex: 1 },
      { value: "It's", normalizedValue: "It's", currentIndex: 2 },
      { value: "a", normalizedValue: "a", currentIndex: 3 },
      { value: "great", normalizedValue: "great", currentIndex: 4 },
      { value: "day...", normalizedValue: "day...", currentIndex: 5 },
      { value: "A", normalizedValue: "A", currentIndex: 6 },
      { value: "wonderful", normalizedValue: "wonderful", currentIndex: 7 },
      { value: "day!", normalizedValue: "day!", currentIndex: 8 },
      { value: "Yeah.", normalizedValue: "Yeah.", currentIndex: 9 },
    ]);
  });

  it("splits text into characters", () => {
    const tokens = tokenizeText("abc!", { separation: "character" });

    expect(tokens).toEqual([
      { value: "a", normalizedValue: "a", currentIndex: 0 },
      { value: "b", normalizedValue: "b", currentIndex: 1 },
      { value: "c", normalizedValue: "c", currentIndex: 2 },
      { value: "!", normalizedValue: "!", currentIndex: 3 },
    ]);
  });

  it("splits text by words when separation type is unknown", () => {
    const tokens = tokenizeText("hello   world");

    expect(tokens).toEqual([
      { value: "hello", normalizedValue: "hello", currentIndex: 0 },
      { value: "world", normalizedValue: "world", currentIndex: 1 },
    ]);
  });

  it("normalizes tokens by lowercasing when ignoreCase is true", () => {
    const tokens = tokenizeText("Hello WORLD!", {
      separation: "word",
      ignoreCase: true,
    });

    expect(tokens).toEqual([
      { value: "Hello", normalizedValue: "hello", currentIndex: 0 },
      { value: "WORLD!", normalizedValue: "world!", currentIndex: 1 },
    ]);
  });

  it("removes punctuation in normalizedValue when ignorePunctuation is true", () => {
    const tokens = tokenizeText("hello world!", {
      separation: "word",
      ignorePunctuation: true,
    });

    expect(tokens).toEqual([
      { value: "hello", normalizedValue: "hello", currentIndex: 0 },
      { value: "world!", normalizedValue: "world", currentIndex: 1 },
    ]);
  });

  it("applies both ignoreCase and ignorePunctuation", () => {
    const tokens = tokenizeText("Hello WORLD!", {
      separation: "word",
      ignoreCase: true,
      ignorePunctuation: true,
    });

    expect(tokens).toEqual([
      { value: "Hello", normalizedValue: "hello", currentIndex: 0 },
      { value: "WORLD!", normalizedValue: "world", currentIndex: 1 },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(tokenizeText("", { separation: "word" })).toEqual([]);
    expect(tokenizeText(null, { separation: "word" })).toEqual([]);
    expect(tokenizeText(undefined, { separation: "word" })).toEqual([]);
  });

  it("handles locale-specific segmentation (Japanese)", () => {
    const tokens = tokenizeText("今日はいい天気ですね。", {
      separation: "sentence",
      locale: "ja",
    });

    expect(tokens).toEqual([
      {
        value: "今日はいい天気ですね。",
        normalizedValue: "今日はいい天気ですね。",
        currentIndex: 0,
      },
    ]);
  });

  it("handles CJK word segmentation", () => {
    const tokens = tokenizeText("私は学生です。", {
      separation: "word",
      locale: "ja",
    });

    expect(tokens).toEqual([
      { value: "私", normalizedValue: "私", currentIndex: 0 },
      { value: "は", normalizedValue: "は", currentIndex: 1 },
      { value: "学生", normalizedValue: "学生", currentIndex: 2 },
      { value: "です。", normalizedValue: "です。", currentIndex: 3 },
    ]);
  });

  it("trims extra spacing in sentences", () => {
    const tokens = tokenizeText("  Hello world!   This   is fine. ", {
      separation: "sentence",
    });

    expect(tokens).toEqual([
      {
        value: "Hello world!",
        normalizedValue: "Hello world!",
        currentIndex: 0,
      },
      {
        value: "This   is fine.",
        normalizedValue: "This   is fine.",
        currentIndex: 1,
      },
    ]);
  });

  it("merges multiple punctuation marks", () => {
    const tokens = tokenizeText("Wait!!! Really??", { separation: "word" });
    expect(tokens).toEqual([
      { value: "Wait!!!", normalizedValue: "Wait!!!", currentIndex: 0 },
      { value: "Really??", normalizedValue: "Really??", currentIndex: 1 },
    ]);
  });

  it("keeps emojis as standalone tokens", () => {
    const tokens = tokenizeText("Hello 😊 world!", { separation: "word" });
    expect(tokens).toEqual([
      { value: "Hello", normalizedValue: "Hello", currentIndex: 0 },
      { value: "😊", normalizedValue: "😊", currentIndex: 1 },
      { value: "world!", normalizedValue: "world!", currentIndex: 2 },
    ]);
  });

  it("handles numbers and punctuation", () => {
    const tokens = tokenizeText("Version 2.0 is out!", { separation: "word" });

    expect(tokens).toEqual([
      { value: "Version", normalizedValue: "Version", currentIndex: 0 },
      { value: "2.0", normalizedValue: "2.0", currentIndex: 1 },
      { value: "is", normalizedValue: "is", currentIndex: 2 },
      { value: "out!", normalizedValue: "out!", currentIndex: 3 },
    ]);
  });

  it("handles mixed scripts", () => {
    const tokens = tokenizeText("Hello 世界!", { separation: "word" });

    expect(tokens).toEqual([
      { value: "Hello", normalizedValue: "Hello", currentIndex: 0 },
      { value: "世界!", normalizedValue: "世界!", currentIndex: 1 },
    ]);
  });

  it("does not merge symbols that are not punctuation", () => {
    const tokens = tokenizeText("hello + world", { separation: "word" });

    expect(tokens).toEqual([
      { value: "hello", normalizedValue: "hello", currentIndex: 0 },
      { value: "+", normalizedValue: "+", currentIndex: 1 },
      { value: "world", normalizedValue: "world", currentIndex: 2 },
    ]);
  });

  it("handles unicode punctuation like em-dash and ellipsis", () => {
    const tokens = tokenizeText("Is Jean-Claude cool?", { separation: "word" });
    expect(tokens).toEqual([
      { value: "Is", normalizedValue: "Is", currentIndex: 0 },
      { value: "Jean-Claude", normalizedValue: "Jean-Claude", currentIndex: 1 },
      { value: "cool?", normalizedValue: "cool?", currentIndex: 2 },
    ]);
  });

  it("ignorePunctuation removes unicode punctuation", () => {
    const tokens = tokenizeText("Wait—really…?", {
      separation: "word",
      ignorePunctuation: true,
    });

    expect(tokens).toEqual([
      {
        value: "Wait—really…?",
        normalizedValue: "Waitreally",
        currentIndex: 0,
      },
    ]);
  });
});
