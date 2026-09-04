import { Token } from "@models/lcs";

const CODE_EMOJI =
  String.raw`\p{Regional_Indicator}{2}` +
  String.raw`|\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F|\u200D\p{Extended_Pictographic})*`;
const CODE_IDENTIFIER = String.raw`[\p{L}\p{N}_$][\p{L}\p{N}\p{M}_$]*`;
const CODE_SYMBOL = String.raw`[^\s\p{L}\p{N}_$\p{M}]\p{M}*`;
const CODE_ORPHAN_MARKS = String.raw`\p{M}+`;
const CODE_TOKEN = new RegExp(
  String.raw`\s*(?:${CODE_EMOJI}|${CODE_IDENTIFIER}|${CODE_SYMBOL}|${CODE_ORPHAN_MARKS})`,
  "gu",
);

export const tokenizeCode = (code: string | null | undefined): Token[] => {
  const result: Token[] = [];
  if (!code) return result;

  const tokens = code.match(CODE_TOKEN) || [];
  let matchedLength = 0;
  for (let i = 0; i < tokens.length; i++) {
    const value = tokens[i];
    matchedLength += value.length;
    result.push({
      value,
      normalizedValue: value,
      index: i,
    });
  }

  const trailingWhitespace = code.slice(matchedLength);
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
};
