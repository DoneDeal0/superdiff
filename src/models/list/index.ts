export enum LIST_STATUS {
  ADDED = "added",
  EQUAL = "equal",
  DELETED = "deleted",
  UPDATED = "updated",
  MOVED = "moved",
}

export type ListData = unknown;

export type ListDiffOptions = {
  showOnly?: `${LIST_STATUS}`[];
  referenceProperty?: string;
  considerMoveAsUpdate?: boolean;
  ignoreArrayOrder?: boolean;
};

export const DEFAULT_LIST_DIFF_OPTIONS = {
  showOnly: [],
  referenceProperty: undefined,
  considerMoveAsUpdate: false,
  ignoreArrayOrder: false,
};

export type ListDiff = {
  type: "list";
  status: LIST_STATUS;
  diff: {
    value: ListData;
    prevIndex: number | null;
    newIndex: number | null;
    indexDiff: number | null;
    status: LIST_STATUS;
  }[];
};
