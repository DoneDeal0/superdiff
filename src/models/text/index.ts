export const DEFAULT_TEXT_DIFF_OPTIONS: TextDiffOptions = {
  showOnly: [],
  mode: "visual",
  separation: "word",
  ignoreCase: false,
  ignorePunctuation: false,
  locale: undefined,
};

export type TextToken = {
  value: string;
  normalizedValue: string;
  currentIndex: number;
};

export type TextTokenDiff = {
  value: string;
  previousValue?: string;
  status: TextStatus;
  currentIndex: number | null;
  previousIndex: number | null;
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
  mode?: "visual" | "strict";
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
    previousValue?: string;
    status: TextStatus;
    currentIndex: number | null;
    previousIndex: number | null;
  }[];
};
