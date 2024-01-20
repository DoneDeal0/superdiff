export const STATUS: Record<string, ObjectDiffStatus> = {
  ADDED: "added",
  EQUAL: "equal",
  DELETED: "deleted",
  UPDATED: "updated",
};

export const LIST_STATUS: Record<string, ListDiffStatus> = {
  ...STATUS,
  MOVED: "moved",
};

export const GRANULARITY: Record<string, "basic" | "deep"> = {
  BASIC: "basic",
  DEEP: "deep",
};

export type ListDiffStatus =
  | "added"
  | "equal"
  | "moved"
  | "deleted"
  | "updated";
export type ObjectDiffStatus = "added" | "equal" | "deleted" | "updated";
export type ObjectData = Record<string, any> | undefined | null;
export type ListData = any;

export type ObjectStatusTuple = readonly [
  "added",
  "equal",
  "deleted",
  "updated"
];
export type ListStatusTuple = readonly [
  "added",
  "equal",
  "deleted",
  "moved",
  "updated"
];

export type isEqualOptions = {
  ignoreArrayOrder?: boolean;
};

export type ObjectOptions = {
  ignoreArrayOrder?: boolean;
  showOnly?: {
    statuses: Array<ObjectStatusTuple[number]>;
    granularity?: (typeof GRANULARITY)[keyof typeof GRANULARITY];
  };
};

export type ListOptions = {
  showOnly?: Array<ListStatusTuple[number]>;
  referenceProperty?: string;
};

export type ListDiff = {
  type: "list";
  status: ListDiffStatus;
  diff: {
    value: ListData;
    prevIndex: number | null;
    newIndex: number | null;
    indexDiff: number | null;
    status: ListDiffStatus;
  }[];
};

export type SubProperties = {
  property: string;
  previousValue: any;
  currentValue: any;
  status: ObjectDiffStatus;
  subPropertiesDiff?: SubProperties[];
};

export type ObjectDiff = {
  type: "object";
  status: ObjectDiffStatus;
  diff: {
    property: string;
    previousValue: any;
    currentValue: any;
    status: ObjectDiffStatus;
    subPropertiesDiff?: SubProperties[];
  }[];
};

export type DataDiff = ListDiff | ObjectDiff;
