export const DEFAULT_TEXT_DIFF_OPTIONS: TextDiffOptions = {
  accuracy: "normal",
  detectMoves: false,
  separation: "word",
  ignoreCase: false,
  ignorePunctuation: false,
  locale: undefined,
};

export type TextToken = {
  value: string;
  normalizedValue: string;
  index: number;
};

export type TextTokenDiff = {
  value: string;
  index: number | null;
  previousValue?: string;
  previousIndex: number | null;
  status: TextStatus;
};

export enum TextStatus {
  ADDED = "added",
  EQUAL = "equal",
  DELETED = "deleted",
  UPDATED = "updated",
  MOVED = "moved",
}

export type TextDiffOptions = {
  separation?: "character" | "word" | "sentence";
  accuracy?: "normal" | "high";
  detectMoves?: boolean;
  ignoreCase?: boolean;
  ignorePunctuation?: boolean;
  locale?: Intl.Locale | string;
};

export type TextDiff = {
  type: "text";
  status: "added" | "equal" | "deleted" | "updated";
  diff: {
    value: string;
    index: number | null;
    previousValue?: string;
    previousIndex: number | null;
    status: TextStatus;
  }[];
};
