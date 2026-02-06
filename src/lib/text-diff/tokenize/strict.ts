import {
  DEFAULT_TEXT_DIFF_OPTIONS,
  EMOJI_SPLIT_REGEX,
  PUNCTUATION_REGEX,
  TextDiffOptions,
  TextToken,
} from "@models/text";

const segmenterCache = new Map<string, Intl.Segmenter>();
const QUOTES = new Set(['"', "'", "“", "”", "‘", "’"]);

function getSegmenter(
  locale: Intl.Locale | string | undefined,
  granularity: "word" | "sentence",
) {
  const key = `${locale || "default"}-${granularity}`;
  let segmenter = segmenterCache.get(key);
  if (!segmenter) {
    segmenter = new Intl.Segmenter(locale, { granularity });
    segmenterCache.set(key, segmenter);
  }
  return segmenter;
}

function normalizeToken(token: string, options: TextDiffOptions): string {
  let normalizedToken = token;
  if (options.ignoreCase) {
    normalizedToken = normalizedToken.toLowerCase();
  }
  if (options.ignorePunctuation) {
    normalizedToken = normalizedToken.replace(PUNCTUATION_REGEX, "");
  }
  return normalizedToken;
}

export const tokenizeStrictText = (
  text: string | null | undefined,
  options: TextDiffOptions = DEFAULT_TEXT_DIFF_OPTIONS,
): TextToken[] => {
  const result: TextToken[] = [];
  if (!text || !text.trim()) return result;

  const separation = options.separation || DEFAULT_TEXT_DIFF_OPTIONS.separation;
  const locale = options.locale;

  if (separation === "character") {
    let index = 0;
    for (const char of text) {
      const trimmedChar = char.trim();
      if (trimmedChar) {
        const normalizedValue = normalizeToken(trimmedChar, options);
        if (normalizedValue) {
          result.push({
            value: trimmedChar,
            normalizedValue,
            index: index,
          });
          index++;
        }
      }
    }
    return result;
  }

  if (separation === "word") {
    const segmenter = getSegmenter(locale, "word");
    const validWords: string[] = [];

    let lastNonSpaceEndIndex: number | null = null;
    let lastNonSpaceWasWordLike = false;
    let pendingPrefix = "";

    const pushSplit = (word: string) => {
      const parts = word.split(EMOJI_SPLIT_REGEX);
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) validWords.push(parts[i]);
      }
    };

    for (const data of segmenter.segment(text)) {
      const seg = data.segment;
      const endIndex = data.index + seg.length;
      const trimmed = seg.trim();

      if (!trimmed) {
        continue;
      }

      const isWord = data.isWordLike;

      if (QUOTES.has(trimmed)) {
        const isClosingQuote =
          lastNonSpaceWasWordLike && lastNonSpaceEndIndex === data.index;

        if (isClosingQuote && validWords.length > 0) {
          const prev = validWords.pop()!;
          pushSplit(prev + trimmed);
        } else {
          pendingPrefix += trimmed;
        }
        lastNonSpaceEndIndex = endIndex;
        lastNonSpaceWasWordLike = false;
        continue;
      }

      if (isWord) {
        const isAdjacentToPrev =
          lastNonSpaceEndIndex !== null && lastNonSpaceEndIndex === data.index;

        const prevWord =
          validWords.length > 0 ? validWords[validWords.length - 1] : "";
        const endsWithDash =
          prevWord.length > 0 &&
          (prevWord.endsWith("-") || prevWord.endsWith("–") || prevWord.endsWith("—"));

        let token = trimmed;

        if (validWords.length > 0 && isAdjacentToPrev && endsWithDash) {
          const prev = validWords.pop()!;
          token = prev + token;
        }

        if (pendingPrefix) {
          token = pendingPrefix + token;
          pendingPrefix = "";
        }

        pushSplit(token);
        lastNonSpaceEndIndex = endIndex;
        lastNonSpaceWasWordLike = true;
        continue;
      }

      if (validWords.length > 0) {
        const prev = validWords.pop()!;
        pushSplit(prev + trimmed);
      } else {
        pushSplit(trimmed);
      }
      lastNonSpaceEndIndex = endIndex;
      lastNonSpaceWasWordLike = false;
    }

    for (let i = 0; i < validWords.length; i++) {
      const value = validWords[i];
      result.push({
        value,
        normalizedValue: normalizeToken(value, options),
        index: i,
      });
    }

    return result;
  }
  else {
    const segmenter = getSegmenter(locale, "sentence");
    let index = 0;
    for (const data of segmenter.segment(text)) {
      const trimmedSentence = data.segment.trim();
      if (trimmedSentence) {
        result.push({
          value: trimmedSentence,
          normalizedValue: normalizeToken(trimmedSentence, options),
          index: index,
        });
        index++;
      }
    }
    return result;
  }
};
