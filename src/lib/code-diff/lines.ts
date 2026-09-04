import { Token } from "@models/lcs";

export const tokenizeLines = (code: string): Token[] =>
  code.split("\n").map((value, index) => ({
    value,
    normalizedValue: value,
    index,
  }));
