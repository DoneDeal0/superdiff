export const DEFAULT_LIST_DIFF_OPTIONS = {
  showOnly: [],
  referenceKey: undefined,
  considerMoveAsUpdate: false,
  ignoreArrayOrder: false,
};

export enum ListStatus {
  ADDED = "added",
  EQUAL = "equal",
  DELETED = "deleted",
  UPDATED = "updated",
  MOVED = "moved",
}

export enum ListType {
  PREV = "prevList",
  NEXT = "nextList",
}

export type ListDiffOptions = {
  showOnly?: `${ListStatus}`[];
  referenceKey?: string;
  considerMoveAsUpdate?: boolean;
  ignoreArrayOrder?: boolean;
};

export type ListData<T> = {
  indexes: number[];
  value: T;
};

export type ListDiff = {
  type: "list";
  status: `${ListStatus}`;
  diff: {
    value: unknown;
    previousIndex: number | null;
    index: number | null;
    status: `${ListStatus}`;
  }[];
};
