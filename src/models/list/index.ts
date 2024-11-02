export const DEFAULT_LIST_DIFF_OPTIONS = {
  showOnly: [],
  referenceProperty: undefined,
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
  referenceProperty?: string;
  considerMoveAsUpdate?: boolean;
  ignoreArrayOrder?: boolean;
};

export type ListDiff = {
  type: "list";
  status: `${ListStatus}`;
  diff: {
    value: unknown;
    prevIndex: number | null;
    newIndex: number | null;
    indexDiff: number | null;
    status: ListStatus;
  }[];
};
