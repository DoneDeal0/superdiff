import { myersDiff } from "@core/myers";
import { LCSStatus, Token } from "@models/lcs";

const tok = (values: string[]): Token[] =>
  values.map((value, index) => ({ value, normalizedValue: value, index }));

describe("myersDiff", () => {
  it("returns no edit for two empty token lists", () => {
    expect(myersDiff(tok([]), tok([]))).toStrictEqual([]);
  });

  it("marks every token equal for identical lists", () => {
    expect(myersDiff(tok(["a", "b"]), tok(["a", "b"]))).toStrictEqual([
      { status: LCSStatus.EQUAL, prev: 0, curr: 0 },
      { status: LCSStatus.EQUAL, prev: 1, curr: 1 },
    ]);
  });

  it("marks every token added when previous is empty", () => {
    expect(myersDiff(tok([]), tok(["a", "b"]))).toStrictEqual([
      { status: LCSStatus.ADDED, curr: 0 },
      { status: LCSStatus.ADDED, curr: 1 },
    ]);
  });

  it("marks every token deleted when current is empty", () => {
    expect(myersDiff(tok(["a", "b"]), tok([]))).toStrictEqual([
      { status: LCSStatus.DELETED, prev: 0 },
      { status: LCSStatus.DELETED, prev: 1 },
    ]);
  });

  it("reports a single insertion", () => {
    expect(myersDiff(tok(["a", "c"]), tok(["a", "b", "c"]))).toStrictEqual([
      { status: LCSStatus.EQUAL, prev: 0, curr: 0 },
      { status: LCSStatus.ADDED, curr: 1 },
      { status: LCSStatus.EQUAL, prev: 1, curr: 2 },
    ]);
  });

  it("reports a single deletion", () => {
    expect(myersDiff(tok(["a", "b", "c"]), tok(["a", "c"]))).toStrictEqual([
      { status: LCSStatus.EQUAL, prev: 0, curr: 0 },
      { status: LCSStatus.DELETED, prev: 1 },
      { status: LCSStatus.EQUAL, prev: 2, curr: 1 },
    ]);
  });

  it("reports a replacement", () => {
    expect(myersDiff(tok(["a", "b", "c"]), tok(["a", "x", "c"]))).toStrictEqual(
      [
        { status: LCSStatus.EQUAL, prev: 0, curr: 0 },
        { status: LCSStatus.DELETED, prev: 1 },
        { status: LCSStatus.ADDED, curr: 1 },
        { status: LCSStatus.EQUAL, prev: 2, curr: 2 },
      ],
    );
  });

  it("keeps a common prefix and suffix equal", () => {
    expect(
      myersDiff(tok(["a", "b", "c", "d"]), tok(["a", "x", "y", "d"])),
    ).toStrictEqual([
      { status: LCSStatus.EQUAL, prev: 0, curr: 0 },
      { status: LCSStatus.DELETED, prev: 1 },
      { status: LCSStatus.DELETED, prev: 2 },
      { status: LCSStatus.ADDED, curr: 1 },
      { status: LCSStatus.ADDED, curr: 2 },
      { status: LCSStatus.EQUAL, prev: 3, curr: 3 },
    ]);
  });

  it("handles two lists with nothing in common", () => {
    expect(myersDiff(tok(["a", "b"]), tok(["x", "y"]))).toStrictEqual([
      { status: LCSStatus.DELETED, prev: 0 },
      { status: LCSStatus.DELETED, prev: 1 },
      { status: LCSStatus.ADDED, curr: 0 },
      { status: LCSStatus.ADDED, curr: 1 },
    ]);
  });

  it("handles a repeated token", () => {
    expect(myersDiff(tok(["a", "a", "b"]), tok(["a", "b"]))).toStrictEqual([
      { status: LCSStatus.EQUAL, prev: 0, curr: 0 },
      { status: LCSStatus.DELETED, prev: 1 },
      { status: LCSStatus.EQUAL, prev: 2, curr: 1 },
    ]);
  });

  it("compares on normalizedValue, not on value", () => {
    const previous: Token[] = [
      { value: "Foo", normalizedValue: "foo", index: 0 },
    ];
    const current: Token[] = [
      { value: "FOO", normalizedValue: "foo", index: 0 },
    ];

    expect(myersDiff(previous, current)).toStrictEqual([
      { status: LCSStatus.EQUAL, prev: 0, curr: 0 },
    ]);
  });

  it("produces an edit script that rebuilds both token lists", () => {
    let seed = 99;
    const rnd = () =>
      (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const alphabet = "abcde";
    const make = () => {
      const size = Math.floor(rnd() * 12);
      const values: string[] = [];
      for (let i = 0; i < size; i++) {
        values.push(alphabet[Math.floor(rnd() * alphabet.length)]);
      }
      return tok(values);
    };

    for (let i = 0; i < 500; i++) {
      const previous = make();
      const current = make();
      const edits = myersDiff(previous, current);

      let rebuiltPrevious = "";
      let rebuiltCurrent = "";
      for (const edit of edits) {
        if (edit.status === LCSStatus.EQUAL) {
          rebuiltPrevious += previous[edit.prev].value;
          rebuiltCurrent += current[edit.curr].value;
        } else if (edit.status === LCSStatus.ADDED) {
          rebuiltCurrent += current[edit.curr].value;
        } else {
          rebuiltPrevious += previous[edit.prev].value;
        }
      }

      expect(rebuiltPrevious).toBe(previous.map((t) => t.value).join(""));
      expect(rebuiltCurrent).toBe(current.map((t) => t.value).join(""));
    }
  });

  it("walks indexes forward without repeating or skipping", () => {
    const previous = tok(["a", "b", "c", "d", "e"]);
    const current = tok(["a", "x", "c", "y", "e"]);
    const edits = myersDiff(previous, current);

    const prevIndexes: number[] = [];
    const currIndexes: number[] = [];
    for (const edit of edits) {
      if (edit.status !== LCSStatus.ADDED) prevIndexes.push(edit.prev);
      if (edit.status !== LCSStatus.DELETED) currIndexes.push(edit.curr);
    }

    expect(prevIndexes).toStrictEqual([0, 1, 2, 3, 4]);
    expect(currIndexes).toStrictEqual([0, 1, 2, 3, 4]);
  });

  it("stays linear on a long identical list", () => {
    const values = Array.from({ length: 5000 }, (_unused, i) => `t${i}`);
    const edits = myersDiff(tok(values), tok(values));

    expect(edits).toHaveLength(5000);
    expect(edits.every((edit) => edit.status === LCSStatus.EQUAL)).toBe(true);
  });
});
