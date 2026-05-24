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

export type ListDiffOptions<T = unknown> = {
  showOnly?: `${ListStatus}`[];
  referenceKey?: T extends Record<string, unknown>
    ? keyof T & string
    : string;
  considerMoveAsUpdate?: boolean;
  ignoreArrayOrder?: boolean;
};

export const DEFAULT_LIST_DIFF_OPTIONS = {
  showOnly: [],
  referenceKey: undefined,
  considerMoveAsUpdate: false,
  ignoreArrayOrder: false,
} satisfies ListDiffOptions;

export type ListData<T> = {
  indexes: number[];
  value: T;
};

export type ListDiff<T = unknown> = {
  type: "list";
  status: `${ListStatus}`;
  diff: {
    value: T;
    previousIndex: number | null;
    index: number | null;
    status: `${ListStatus}`;
  }[];
};
