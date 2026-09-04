import { getCodeDiff } from "@lib/code-diff";
import { CodeDiff } from "@models/code";

function rebuild(diff: CodeDiff): { previous: string; current: string } {
  const previous: string[] = [];
  const current: string[] = [];
  for (const line of diff.diff) {
    switch (line.status) {
      case "equal":
        previous.push(line.previousValue ?? line.value);
        current.push(line.value);
        break;
      case "updated":
        previous.push(line.previousValue ?? "");
        current.push(line.value);
        break;
      case "deleted":
        previous.push(line.value);
        break;
      case "added":
        current.push(line.value);
        break;
    }
  }
  return { previous: previous.join("\n"), current: current.join("\n") };
}

describe("getCodeDiff - general", () => {
  it("returns equal for two empty codes", () => {
    expect(getCodeDiff(null, null)).toStrictEqual({
      type: "code",
      status: "equal",
      diff: [],
    });
  });

  it("marks every line added when there is no previous code", () => {
    expect(getCodeDiff(null, "const a = 1;\nconst b = 2;")).toStrictEqual({
      type: "code",
      status: "added",
      diff: [
        {
          value: "const a = 1;",
          line: 1,
          previousLine: null,
          status: "added",
        },
        {
          value: "const b = 2;",
          line: 2,
          previousLine: null,
          status: "added",
        },
      ],
    });
  });

  it("marks every line deleted when there is no current code", () => {
    expect(getCodeDiff("const a = 1;\nconst b = 2;", null)).toStrictEqual({
      type: "code",
      status: "deleted",
      diff: [
        {
          value: "const a = 1;",
          line: null,
          previousLine: 1,
          status: "deleted",
        },
        {
          value: "const b = 2;",
          line: null,
          previousLine: 2,
          status: "deleted",
        },
      ],
    });
  });

  it("returns equal for identical code", () => {
    expect(getCodeDiff("const a = 1;", "const a = 1;")).toStrictEqual({
      type: "code",
      status: "equal",
      diff: [
        {
          value: "const a = 1;",
          previousValue: "const a = 1;",
          line: 1,
          previousLine: 1,
          status: "equal",
        },
      ],
    });
  });
});

describe("getCodeDiff - lines", () => {
  it("numbers the lines of a mixed change", () => {
    expect(
      getCodeDiff("a();\nb();\nc();", "a();\nb2();\nc();\nd();"),
    ).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "a();",
          previousValue: "a();",
          line: 1,
          previousLine: 1,
          status: "equal",
        },
        {
          value: "b2();",
          previousValue: "b();",
          line: 2,
          previousLine: 2,
          status: "updated",
          diff: [
            { value: "b2", previousValue: "b", status: "updated" },
            { value: "(", status: "equal" },
            { value: ")", status: "equal" },
            { value: ";", status: "equal" },
          ],
        },
        {
          value: "c();",
          previousValue: "c();",
          line: 3,
          previousLine: 3,
          status: "equal",
        },
        {
          value: "d();",
          line: 4,
          previousLine: null,
          status: "added",
        },
      ],
    });
  });

  it("reports an inserted line without touching its neighbours", () => {
    expect(getCodeDiff("a();\nc();", "a();\nb();\nc();")).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "a();",
          previousValue: "a();",
          line: 1,
          previousLine: 1,
          status: "equal",
        },
        {
          value: "b();",
          line: 2,
          previousLine: null,
          status: "added",
        },
        {
          value: "c();",
          previousValue: "c();",
          line: 3,
          previousLine: 2,
          status: "equal",
        },
      ],
    });
  });

  it("reports a deleted line", () => {
    expect(getCodeDiff("a();\nb();\nc();", "a();\nc();")).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "a();",
          previousValue: "a();",
          line: 1,
          previousLine: 1,
          status: "equal",
        },
        {
          value: "b();",
          line: null,
          previousLine: 2,
          status: "deleted",
        },
        {
          value: "c();",
          previousValue: "c();",
          line: 2,
          previousLine: 3,
          status: "equal",
        },
      ],
    });
  });

  it("reports a line ending change", () => {
    expect(getCodeDiff("a\r\nb", "a\nb")).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "a\r",
          line: null,
          previousLine: 1,
          status: "deleted",
        },
        {
          value: "a",
          line: 1,
          previousLine: null,
          status: "added",
        },
        {
          value: "b",
          previousValue: "b",
          line: 2,
          previousLine: 2,
          status: "equal",
        },
      ],
    });
  });
});

describe("getCodeDiff - tokens", () => {
  it("reports the changed tokens of an updated line", () => {
    expect(getCodeDiff("foo(a).bar;", "foo(b).bar;")).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "foo(b).bar;",
          previousValue: "foo(a).bar;",
          line: 1,
          previousLine: 1,
          status: "updated",
          diff: [
            { value: "foo", status: "equal" },
            { value: "(", status: "equal" },
            { value: "b", previousValue: "a", status: "updated" },
            { value: ")", status: "equal" },
            { value: ".", status: "equal" },
            { value: "bar", status: "equal" },
            { value: ";", status: "equal" },
          ],
        },
      ],
    });
  });
});

describe("getCodeDiff - deletions inside a line", () => {
  it("reports a removed argument while the line stays", () => {
    expect(getCodeDiff("foo(a, b);", "foo(a);")).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "foo(a);",
          previousValue: "foo(a, b);",
          line: 1,
          previousLine: 1,
          status: "updated",
          diff: [
            { value: "foo", status: "equal" },
            { value: "(", status: "equal" },
            { value: "a", status: "equal" },
            { value: ",", status: "deleted" },
            { value: " b", status: "deleted" },
            { value: ")", status: "equal" },
            { value: ";", status: "equal" },
          ],
        },
      ],
    });
  });

  it("reports a removed trailing comment while the line stays", () => {
    expect(getCodeDiff("const x = 1; // note", "const x = 1;")).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "const x = 1;",
          previousValue: "const x = 1; // note",
          line: 1,
          previousLine: 1,
          status: "updated",
          diff: [
            { value: "const", status: "equal" },
            { value: " x", status: "equal" },
            { value: " =", status: "equal" },
            { value: " 1", status: "equal" },
            { value: ";", status: "equal" },
            { value: " /", status: "deleted" },
            { value: "/", status: "deleted" },
            { value: " note", status: "deleted" },
          ],
        },
      ],
    });
  });

  it("keeps the neighbouring lines equal", () => {
    expect(
      getCodeDiff("a();\nfoo(a, b);\nc();", "a();\nfoo(a);\nc();"),
    ).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "a();",
          previousValue: "a();",
          line: 1,
          previousLine: 1,
          status: "equal",
        },
        {
          value: "foo(a);",
          previousValue: "foo(a, b);",
          line: 2,
          previousLine: 2,
          status: "updated",
          diff: [
            { value: "foo", status: "equal" },
            { value: "(", status: "equal" },
            { value: "a", status: "equal" },
            { value: ",", status: "deleted" },
            { value: " b", status: "deleted" },
            { value: ")", status: "equal" },
            { value: ";", status: "equal" },
          ],
        },
        {
          value: "c();",
          previousValue: "c();",
          line: 3,
          previousLine: 3,
          status: "equal",
        },
      ],
    });
  });
});

describe("getCodeDiff - whitespace", () => {
  it("reports a re-indentation", () => {
    expect(getCodeDiff("  return x;", "      return x;")).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "      return x;",
          previousValue: "  return x;",
          line: 1,
          previousLine: 1,
          status: "updated",
          diff: [
            {
              value: "      return",
              previousValue: "  return",
              status: "updated",
            },
            { value: " x", status: "equal" },
            { value: ";", status: "equal" },
          ],
        },
      ],
    });
  });

  it("reports tabs converted to spaces", () => {
    expect(getCodeDiff("\tif (a) {", "    if (a) {")).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "    if (a) {",
          previousValue: "\tif (a) {",
          line: 1,
          previousLine: 1,
          status: "updated",
          diff: [
            { value: "    if", previousValue: "\tif", status: "updated" },
            { value: " (", status: "equal" },
            { value: "a", status: "equal" },
            { value: ")", status: "equal" },
            { value: " {", status: "equal" },
          ],
        },
      ],
    });
  });
});

describe("getCodeDiff - languages", () => {
  it("python - added default argument", () => {
    expect(
      getCodeDiff("def load(path, mode):", "def load(path, mode='r'):"),
    ).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "def load(path, mode='r'):",
          previousValue: "def load(path, mode):",
          line: 1,
          previousLine: 1,
          status: "updated",
          diff: [
            { value: "def", status: "equal" },
            { value: " load", status: "equal" },
            { value: "(", status: "equal" },
            { value: "path", status: "equal" },
            { value: ",", status: "equal" },
            { value: " mode", status: "equal" },
            { value: "=", status: "added" },
            { value: "'", status: "added" },
            { value: "r", status: "added" },
            { value: "'", status: "added" },
            { value: ")", status: "equal" },
            { value: ":", status: "equal" },
          ],
        },
      ],
    });
  });

  it("css - hex colour", () => {
    expect(
      getCodeDiff(".btn { color: #fff; }", ".btn { color: #000; }"),
    ).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: ".btn { color: #000; }",
          previousValue: ".btn { color: #fff; }",
          line: 1,
          previousLine: 1,
          status: "updated",
          diff: [
            { value: ".", status: "equal" },
            { value: "btn", status: "equal" },
            { value: " {", status: "equal" },
            { value: " color", status: "equal" },
            { value: ":", status: "equal" },
            { value: " #", status: "equal" },
            { value: "000", previousValue: "fff", status: "updated" },
            { value: ";", status: "equal" },
            { value: " }", status: "equal" },
          ],
        },
      ],
    });
  });

  it("chinese - identifier kept whole", () => {
    expect(
      getCodeDiff(
        "const \u7528\u6237\u540d = '\u5f20\u4e09';",
        "const \u7528\u6237\u540d = '\u674e\u56db';",
      ),
    ).toStrictEqual({
      type: "code",
      status: "updated",
      diff: [
        {
          value: "const \u7528\u6237\u540d = '\u674e\u56db';",
          previousValue: "const \u7528\u6237\u540d = '\u5f20\u4e09';",
          line: 1,
          previousLine: 1,
          status: "updated",
          diff: [
            { value: "const", status: "equal" },
            { value: " \u7528\u6237\u540d", status: "equal" },
            { value: " =", status: "equal" },
            { value: " '", status: "equal" },
            {
              value: "\u674e\u56db",
              previousValue: "\u5f20\u4e09",
              status: "updated",
            },
            { value: "'", status: "equal" },
            { value: ";", status: "equal" },
          ],
        },
      ],
    });
  });
});

describe("getCodeDiff - line pairing", () => {
  it("pairs a rewritten line with its replacement, not with its neighbour", () => {
    const previous = ["let sum = 0;", "return sum;"].join("\n");
    const current = [
      "let sum = 0;",
      "const tax = sum * rate;",
      "return sum + tax;",
    ].join("\n");

    const diff = getCodeDiff(previous, current);

    expect(
      diff.diff.map((line) => [
        line.status,
        line.previousValue ?? null,
        line.value,
      ]),
    ).toStrictEqual([
      ["equal", "let sum = 0;", "let sum = 0;"],
      ["added", null, "const tax = sum * rate;"],
      ["updated", "return sum;", "return sum + tax;"],
    ]);
  });

  it("reports unrelated lines as a deletion and an insertion", () => {
    const diff = getCodeDiff("const a = 1;", "import x from 'y';");

    expect(diff.diff.map((line) => line.status)).toStrictEqual([
      "deleted",
      "added",
    ]);
  });
});

describe("getCodeDiff - unicode safety", () => {
  const GRAPHEMES: [string, string][] = [
    ["decomposed accent", "cafe\u0301"],
    ["devanagari", "\u0915\u094D\u0937\u0924\u094D\u0930\u093F\u092F"],
    ["hebrew with niqqud", "\u05E9\u05B8\u05C1\u05DC\u05D5\u05B9\u05DD"],
    ["zwj family", "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}"],
    ["flag", "\u{1F1EB}\u{1F1F7}"],
    ["skin tone", "\u{1F44D}\u{1F3FD}"],
    ["keycap", "1\uFE0F\u20E3"],
  ];

  it.each(GRAPHEMES)("keeps %s in a single token", (_name, code) => {
    const diff = getCodeDiff(code, code + ";");
    const tokens = diff.diff[0].diff ?? [];

    expect(tokens.map((token) => token.value)).toStrictEqual([code, ";"]);
  });

  it("never splits a grapheme cluster across a random corpus", () => {
    const SCRIPTS = [
      "abcXYZ_$",
      "0123",
      "(){}[];:.,=+-*/<>!?&|^~@#%'\"`\\",
      "cafe\u0301",
      "\u4E2D\u6587",
      "\u65E5\u672C\u8A9E",
      "\u0645\u0631\u062D\u0628\u0627",
      "\u0915\u094D\u0937\u0924\u094D\u0930\u093F\u092F",
      "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
      "\u{1F1EB}\u{1F1F7}",
      "1\uFE0F\u20E3",
      "\u{1F600}",
      " ",
      "\t",
      "  ",
    ];
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

    let seed = 12345;
    const rnd = () =>
      (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    for (let i = 0; i < 500; i++) {
      let code = "";
      const parts = Math.floor(rnd() * 10);
      for (let j = 0; j < parts; j++) {
        code += SCRIPTS[Math.floor(rnd() * SCRIPTS.length)];
      }
      // A shared prefix keeps the two lines similar enough to be paired, so
      // there is a token level diff to inspect.
      const previous = "const a = " + code;
      const current = "const b = " + code;

      const tokens = getCodeDiff(previous, current).diff[0].diff ?? [];
      const values = tokens.map((token) => token.value);
      expect(values.join("")).toBe(current);

      const boundaries = new Set<number>([0]);
      let end = 0;
      for (const grapheme of segmenter.segment(current)) {
        end += grapheme.segment.length;
        boundaries.add(end);
      }

      let offset = 0;
      for (const value of values) {
        offset += value.length;
        expect(boundaries.has(offset)).toBe(true);
      }
    }
  });
});

describe("getCodeDiff - large code snippet", () => {
  const PREVIOUS = [
    "import { useState, useEffect } from 'react';",
    "import { fetchPosts } from '../api/posts';",
    "",
    "const MAX_LENGTH = 280;",
    "",
    "export function PostList({ userId, isSocialPost }) {",
    "  const [posts, setPosts] = useState([]);",
    "  const [loading, setLoading] = useState(true);",
    "",
    "  useEffect(() => {",
    "    let cancelled = false;",
    "    fetchPosts(userId).then((result) => {",
    "      if (!cancelled) {",
    "        setPosts(result.items);",
    "        setLoading(false);",
    "      }",
    "    });",
    "    return () => {",
    "      cancelled = true;",
    "    };",
    "  }, [userId]);",
    "",
    "  if (loading) {",
    "    return <Spinner size='small' />;",
    "  }",
    "",
    "  return (",
    "    <ul className='post-list'>",
    "      {posts.map((post) => {",
    "        const hitSentence = post.body;",
    "        const showMoreButton = isSocialPost && hitSentence?.length > MAX_LENGTH;",
    "        return <li key={post.id}>{hitSentence}</li>;",
    "      })}",
    "    </ul>",
    "  );",
    "}",
  ].join("\n");

  const CURRENT = [
    "import { useState, useEffect, useMemo } from 'react';",
    "import { fetchPosts } from '../api/posts';",
    "",
    "const SOCIAL_TEXT_MAX_LENGTH = 320;",
    "",
    "export function PostList({ userId, isYoutubePost }) {",
    "  const [posts, setPosts] = useState([]);",
    "  const [loading, setLoading] = useState(true);",
    "",
    "  useEffect(() => {",
    "    let cancelled = false;",
    "    fetchPosts(userId).then((result) => {",
    "      if (!cancelled) {",
    "        setPosts(result.items);",
    "        setLoading(false);",
    "      }",
    "    });",
    "    return () => {",
    "      cancelled = true;",
    "    };",
    "  }, [userId]);",
    "",
    "  if (loading) {",
    "    return <Spinner size='large' />;",
    "  }",
    "",
    "  return (",
    "    <ul className='post-list'>",
    "      {posts.map((post) => {",
    "        const hitSentence = post.body;",
    "        const showMoreButton = isYoutubePost && hitSentence?.length > SOCIAL_TEXT_MAX_LENGTH;",
    "        return <li key={post.id}>{hitSentence}</li>;",
    "      })}",
    "    </ul>",
    "  );",
    "}",
  ].join("\n");

  const diff = getCodeDiff(PREVIOUS, CURRENT);

  it("rebuilds both files exactly", () => {
    expect(rebuild(diff)).toEqual({ previous: PREVIOUS, current: CURRENT });
  });

  it("reports the file as updated", () => {
    expect(diff.status).toBe("updated");
  });

  it("leaves every untouched line equal", () => {
    const changed = diff.diff.filter((line) => line.status !== "equal");

    expect(changed).toHaveLength(5);
    expect(changed.every((line) => line.status === "updated")).toBe(true);
  });

  it("numbers every line of both files", () => {
    expect(diff.diff).toHaveLength(PREVIOUS.split("\n").length);
    expect(diff.diff.map((line) => line.line)).toStrictEqual(
      diff.diff.map((_unused, i) => i + 1),
    );
    expect(diff.diff.map((line) => line.previousLine)).toStrictEqual(
      diff.diff.map((_unused, i) => i + 1),
    );
  });

  it("highlights only the renamed identifiers inside the changed lines", () => {
    const showMore = diff.diff.find((line) =>
      line.value.includes("showMoreButton"),
    );

    expect(showMore?.status).toBe("updated");
    expect(
      (showMore?.diff ?? [])
        .filter((token) => token.status !== "equal")
        .map((token) => [token.previousValue, token.value]),
    ).toStrictEqual([
      [" isSocialPost", " isYoutubePost"],
      [" MAX_LENGTH", " SOCIAL_TEXT_MAX_LENGTH"],
    ]);
  });

  it("reports the added import without rewriting the line", () => {
    const importLine = diff.diff[0];
    const added = (importLine.diff ?? []).filter(
      (token) => token.status === "added",
    );

    expect(importLine.status).toBe("updated");
    expect(added.map((token) => token.value)).toStrictEqual([",", " useMemo"]);
  });
});

describe("getCodeDiff - losslessness", () => {
  it("rebuilds a set of real-world snippets", () => {
    const SNIPPETS: [string, string][] = [
      ["foo(a).bar = 1;", "foo(b).bar = 2;"],
      ["(set! foo-bar 1)", "(set! foo-baz 2)"],
      ["@x.nil? && y!", "@x.present? || y!"],
      [".a--b{color:#fff}", ".a--c{color:#000}"],
      ["let a:&'x u8 = b'c';", "let a: String = d'e';"],
      ["SELECT * FROM t WHERE a <> 'b';", "SELECT id FROM t WHERE a = 'c';"],
      ["def f(*args, **kwargs): pass", "def f(*args): return None"],
      ["$x = @$y['k'] ?? 'd';", "$x = @$z['k'] ?? 'e';"],
      ["\tif (a) {\n\t\treturn;\n\t}", "    if (b) {\n        return;\n    }"],
      ["a\n\n\nb", "a\n\nb"],
      ["   ", "      "],
      ["trailing   ", "trailing"],
    ];

    for (const [previous, current] of SNIPPETS) {
      expect(rebuild(getCodeDiff(previous, current))).toEqual({
        previous,
        current,
      });
    }
  });
});
