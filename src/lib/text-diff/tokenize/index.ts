import {
  DEFAULT_TEXT_DIFF_OPTIONS,
  TextDiffOptions,
  TextToken,
} from "@models/text";

const normalizeToken = (token: string, options: TextDiffOptions): string => {
  let nextToken = token;
  if (options.ignoreCase) {
    nextToken = nextToken.toLowerCase();
  }
  if (options.ignorePunctuation) {
    nextToken = nextToken.replace(/[",;:!?“”‘’'«»()[\]{}…—–-]/g, "");
  }
  return nextToken;
};

export const tokenizeText = (
  text: string | null | undefined,
  options: TextDiffOptions = DEFAULT_TEXT_DIFF_OPTIONS,
): TextToken[] => {
  const result: TextToken[] = [];

  const generateToken = (token: string, currentIndex: number) => {
    if (token) {
      result.push({
        value: token,
        normalizedValue: normalizeToken(token, options),
        currentIndex,
      });
    }
  };

  // Intl.Segmenter splits words and punctuation separately.
  // This function merges them into user-expected tokens like: "word!", "Jean-Claude", "day..."
  const mergeWordsPunctuation = (tokens: Intl.SegmentData[]): string[] => {
    const mergedWords: string[] = [];

    const pushSplit = (segment: string) => {
      const parts = segment
        .split(
          /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|[+\\/*=<>%&|^~@#$€£¥])/gu,
        )
        .filter(Boolean);
      mergedWords.push(...parts);
    };

    let lastEndIndex: number | null = null;

    for (const { segment, isWordLike, index } of tokens) {
      const endIndex = index + segment.length;
      const validSegment = segment.trim();
      if (!validSegment) {
        lastEndIndex = endIndex;
        continue;
      }
      if (isWordLike) {
        const isAdjacent = lastEndIndex === index;
        const endsWithDash = /[—–-]$/.test(mergedWords.at(-1) || "");

        if (mergedWords.length > 0 && isAdjacent && endsWithDash) {
          const prev = mergedWords.pop()!;
          pushSplit(prev + validSegment);
        } else {
          pushSplit(validSegment);
        }
      } else if (mergedWords.length > 0) {
        const prev = mergedWords.pop()!;
        pushSplit(prev + validSegment);
      } else {
        pushSplit(validSegment);
      }
      lastEndIndex = endIndex;
    }
    return mergedWords;
  };

  if (!text?.trim()) return result;
  switch (options.separation) {
    case "character":
      [...text].forEach((token, i) => generateToken(token.trim(), i));
      break;
    case "sentence": {
      const segmenter = new Intl.Segmenter(options.locale, {
        granularity: "sentence",
      });
      for (const [i, { segment }] of [...segmenter.segment(text)].entries()) {
        generateToken(segment.trim(), i);
      }
      break;
    }
    case "word": {
      const segmenter = new Intl.Segmenter(options.locale, {
        granularity: "word",
      });
      const tokens = [...segmenter.segment(text)];
      mergeWordsPunctuation(tokens).forEach((token, i) =>
        generateToken(token, i),
      );
      break;
    }
    default:
      text.split(/\s+/u).forEach(generateToken);
  }
  return result;
};
