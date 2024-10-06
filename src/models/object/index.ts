export enum OBJECT_STATUS {
  ADDED = "added",
  EQUAL = "equal",
  DELETED = "deleted",
  UPDATED = "updated",
}

export enum GRANULARITY {
  BASIC = "basic",
  DEEP = "deep",
}

export type ObjectData = Record<string, unknown> | undefined | null;

export type ObjectDiffOptions = {
  ignoreArrayOrder?: boolean;
  showOnly?: {
    statuses: `${OBJECT_STATUS}`[];
    granularity?: `${GRANULARITY}`;
  };
};

export const DEFAULT_OBJECT_DIFF_OPTIONS = {
  ignoreArrayOrder: false,
  showOnly: { statuses: [], granularity: GRANULARITY.BASIC },
};

/** recursive diff in case of subproperties */
export type Diff = {
  property: string;
  previousValue: unknown;
  currentValue: unknown;
  status: OBJECT_STATUS;
  diff?: Diff[];
};

export type ObjectDiff = {
  type: "object";
  status: OBJECT_STATUS;
  diff: Diff[];
};
