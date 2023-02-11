declare const GRANULARITY: Record<string, "basic" | "deep">;
type ListDiffStatus = "added" | "equal" | "moved" | "deleted" | "updated";
type ObjectDiffStatus = "added" | "equal" | "deleted" | "updated";
type ObjectData = Record<string, any> | undefined | null;
type ListData = any;
type ObjectStatusTuple = readonly [
    "added",
    "equal",
    "deleted",
    "updated"
];
type ListStatusTuple = readonly [
    "added",
    "equal",
    "deleted",
    "moved",
    "updated"
];
type isEqualOptions = {
    ignoreArrayOrder?: boolean;
};
type ObjectOptions = {
    ignoreArrayOrder?: boolean;
    showOnly?: {
        statuses: Array<ObjectStatusTuple[number]>;
        granularity?: typeof GRANULARITY[keyof typeof GRANULARITY];
    };
};
type ListOptions = {
    showOnly?: Array<ListStatusTuple[number]>;
};
type ListDiff = {
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
type SubProperties = {
    property: string;
    previousValue: any;
    currentValue: any;
    status: ObjectDiffStatus;
    subPropertiesDiff?: SubProperties[];
};
type ObjectDiff = {
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

declare function getObjectDiff(prevData: ObjectData, nextData: ObjectData, options?: ObjectOptions): ObjectDiff;

declare const getListDiff: (prevList: ListData[] | undefined | null, nextList: ListData[] | undefined | null, options?: ListOptions) => ListDiff;

declare function isEqual(a: any, b: any, options?: isEqualOptions): boolean;
declare function isObject(value: any): value is Record<string, any>;

export { getListDiff, getObjectDiff, isEqual, isObject };
