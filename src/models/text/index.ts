export const DEFAULT_TEXT_DIFF_OPTIONS: TextDiffOptions = {
  showOnly: [],
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
  showOnly?: `${TextStatus}`[];
  separation?: "character" | "word" | "sentence";
  accuracy?: "normal" | "strict";
  detectMoves?: boolean;
  ignoreCase?: boolean;
  ignorePunctuation?: boolean;
  locale?: Intl.Locale | string;
};

export type TextDiff = {
  type: "text";
  status:
    | TextStatus.ADDED
    | TextStatus.DELETED
    | TextStatus.EQUAL
    | TextStatus.UPDATED;
  diff: {
    value: string;
    index: number | null;
    previousValue?: string;
    previousIndex: number | null;
    status: TextStatus;
  }[];
};
