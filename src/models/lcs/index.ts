import { CodeStatus } from "@models/code";
import { TextStatus } from "@models/text";

export type Token = {
  value: string;
  normalizedValue: string;
  index: number;
};

export type TokenDiff<T extends CodeStatus | TextStatus> = T extends CodeStatus
  ? {
      value: string;
      previousValue?: string;
      status: T;
    }
  : {
      value: string;
      index: number | null;
      previousValue?: string;
      previousIndex: number | null;
      status: T;
    };

export enum LCSStatus {
  ADDED = "added",
  DELETED = "deleted",
  EQUAL = "equal",
}

export type MyersEdit =
  | { status: LCSStatus.EQUAL; prev: number; curr: number }
  | { status: LCSStatus.ADDED; curr: number }
  | { status: LCSStatus.DELETED; prev: number };
