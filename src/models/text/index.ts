export const PUNCTUATION_REGEX = /[",;:!?“”‘’'«»()[\]{}…—–-]/g;

export const EMOJI_SPLIT_REGEX =
  /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|[+\\/*=<>%&|^~@#$€£¥])/gu;

export const DEFAULT_TEXT_DIFF_OPTIONS: TextDiffOptions = {
  accuracy: "normal",
  detectMoves: false,
  separation: "word",
  ignoreCase: false,
  ignorePunctuation: false,
  preserveWhitespace: false,
  locale: undefined,
};

export enum TextStatus {
  ADDED = "added",
  EQUAL = "equal",
  DELETED = "deleted",
  UPDATED = "updated",
  MOVED = "moved",
}

export type TextSeparation = "character" | "word" | "sentence";

type TextDiffCommonOptions = {
  detectMoves?: boolean;
  ignoreCase?: boolean;
  ignorePunctuation?: boolean;
  locale?: Intl.Locale | string;
};

export type TextDiffOptions = TextDiffCommonOptions &
  (
    | {
        accuracy?: "normal";
        separation?: TextSeparation;
        preserveWhitespace?: boolean;
      }
    | {
        accuracy: "high";
        separation?: TextSeparation;
        preserveWhitespace?: never;
      }
  );

export type TextDiff = {
  type: "text";
  status: "added" | "equal" | "deleted" | "updated";
  diff: {
    value: string;
    index: number | null;
    previousValue?: string;
    previousIndex: number | null;
    status: `${TextStatus}`;
  }[];
};
