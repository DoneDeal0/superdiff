export const STATUS: Record<string, DiffStatus> = {
  ADDED: "added",
  EQUAL: "equal",
  MOVED: "moved",
  DELETED: "deleted",
  UPDATED: "updated",
};

export type DiffStatus = "added" | "equal" | "moved" | "deleted" | "updated";
export type ObjectData = Record<string, any> | undefined | null;
export type ListData = any;

export type ListDiff = {
  type: "list";
  status: DiffStatus;
  diff: {
    value: ListData;
    prevIndex: number | null;
    newIndex: number | null;
    indexDiff: number | null;
    status: DiffStatus;
  }[];
};

export type Subproperties = {
  name: string;
  previousValue: any;
  currentValue: any;
  status: DiffStatus;
  subDiff?: Subproperties[];
};

export type ObjectDiff = {
  type: "object";
  status: DiffStatus;
  diff: {
    property: string;
    previousValue: any;
    currentValue: any;
    status: DiffStatus;
    subPropertiesDiff?: Subproperties[];
  }[];
};

export type DataDiff = ListDiff | ObjectDiff;
