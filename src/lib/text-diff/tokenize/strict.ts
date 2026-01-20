import {
  DEFAULT_TEXT_DIFF_OPTIONS,
  TextDiffOptions,
  TextToken,
} from "@models/text";

const PUNCTUATION_REGEX = /[",;:!?“”‘’'«»()[\]{}…—–-]/g;
const EMOJI_SPLIT_REGEX =
  /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|[+\\/*=<>%&|^~@#$€£¥])/gu;

const segmenterCache = new Map<string, Intl.Segmenter>();

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

  const { separation, locale } = options;

  if (separation === "character") {
    let index = 0;
    for (const char of text) {
      const trimmedChar = char.trim();
      if (trimmedChar) {
        result.push({
          value: trimmedChar,
          normalizedValue: normalizeToken(trimmedChar, options),
          index: index,
        });
      }
      index++;
    }
    return result;
  }

  if (separation === "word") {
    const segmenter = getSegmenter(locale, "word");
    const validWords: string[] = [];
    let lastEndIndex: number | null = null;

    for (const data of segmenter.segment(text)) {
      const word = data.segment;
      const trimmedWord = word.trim();
      if (!trimmedWord) {
        lastEndIndex = data.index + word.length;
        continue;
      }

      const endIndex = data.index + word.length;
      const isAdjacent = lastEndIndex === data.index;
      const prevWord =
        validWords.length > 0 ? validWords[validWords.length - 1] : "";
      const endsWithDash = /[—–-]$/.test(prevWord);

      const pushSplit = (word: string) => {
        const parts = word.split(EMOJI_SPLIT_REGEX).filter(Boolean);
        for (let i = 0; i < parts.length; i++) validWords.push(parts[i]);
      };

      if (data.isWordLike) {
        if (validWords.length > 0 && isAdjacent && endsWithDash) {
          const prevToken = validWords.pop()!;
          pushSplit(prevToken + trimmedWord);
        } else {
          pushSplit(trimmedWord);
        }
      } else {
        if (validWords.length > 0) {
          const prevToken = validWords.pop()!;
          pushSplit(prevToken + trimmedWord);
        } else {
          pushSplit(trimmedWord);
        }
      }

      lastEndIndex = endIndex;
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
  } else {
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
