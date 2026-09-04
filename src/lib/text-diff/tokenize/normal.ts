import { Token } from "@models/lcs";
import {
  DEFAULT_TEXT_DIFF_OPTIONS,
  PUNCTUATION_REGEX,
  TextDiffOptions,
  TextSeparation,
} from "@models/text";

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

const TOKEN = {
  character: /\S/gu,
  word: /\S+/g,
  sentence: /[^.!?]+[.!?]+|\S+/g,
};

const TOKEN_WITH_LEADING_WHITESPACE = {
  character: /\s*\S/gu,
  word: /\s*\S+/g,
  sentence: /\s*(?:[^.!?]+[.!?]+|\S+)/g,
};

function tokenizePreservingWhitespace(
  text: string,
  options: TextDiffOptions,
  separation: TextSeparation,
): Token[] {
  const result: Token[] = [];
  const tokens = text.match(TOKEN_WITH_LEADING_WHITESPACE[separation]) || [];

  let matchedLength = 0;
  for (let i = 0; i < tokens.length; i++) {
    const value = tokens[i];
    matchedLength += value.length;
    result.push({
      value,
      normalizedValue: normalizeToken(value, options),
      index: i,
    });
  }

  const trailingWhitespace = text.slice(matchedLength);
  if (!trailingWhitespace) return result;

  if (result.length === 0) {
    result.push({
      value: trailingWhitespace,
      normalizedValue: trailingWhitespace,
      index: 0,
    });
    return result;
  }

  const lastToken = result[result.length - 1];
  lastToken.value += trailingWhitespace;
  lastToken.normalizedValue += trailingWhitespace;
  return result;
}

export const tokenizeNormalText = (
  text: string | null | undefined,
  options: TextDiffOptions = DEFAULT_TEXT_DIFF_OPTIONS,
): Token[] => {
  const separation = options.separation || DEFAULT_TEXT_DIFF_OPTIONS.separation;
  const result: Token[] = [];
  if (!text) return result;

  if (options.preserveWhitespace) {
    return tokenizePreservingWhitespace(text, options, separation ?? "word");
  }

  if (!text.trim()) return result;

  if (separation !== "word") {
    if (separation === "sentence") {
      const sentences = text.match(TOKEN.sentence) || [];
      let index = 0;
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
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
  }

  const tokens = text.match(TOKEN.word) || [];
  for (let i = 0; i < tokens.length; i++) {
    const value = tokens[i];
    result.push({
      value,
      normalizedValue: normalizeToken(value, options),
      index: i,
    });
  }
  return result;
};
