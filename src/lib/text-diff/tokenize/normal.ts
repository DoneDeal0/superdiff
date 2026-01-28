import {
  DEFAULT_TEXT_DIFF_OPTIONS,
  TextDiffOptions,
  TextToken,
} from "@models/text";

const PUNCTUATION_REGEX = /[",;:!?“”‘’'«»()[\]{}…—–-]/g;

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

export const tokenizeNormalText = (
  text: string | null | undefined,
  options: TextDiffOptions = DEFAULT_TEXT_DIFF_OPTIONS,
): TextToken[] => {
  const separation = options.separation || DEFAULT_TEXT_DIFF_OPTIONS.separation;
  const result: TextToken[] = [];
  if (!text || !text.trim()) return result;

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
    const tokens = text.match(/\S+/g) || [];
    for (let i = 0; i < tokens.length; i++) {
      const value = tokens[i];
      result.push({
        value,
        normalizedValue: normalizeToken(value, options),
        index: i,
      });
    }
    return result;
  } else {
    const sentences = text.match(/[^.!?]+[.!?]+|\S+/g) || [];
    let index = 0;
    for (const data of sentences) {
      const trimmedSentence = data.trim();
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
