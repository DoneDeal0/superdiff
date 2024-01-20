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
        granularity?: (typeof GRANULARITY)[keyof typeof GRANULARITY];
    };
};
type ListOptions = {
    showOnly?: Array<ListStatusTuple[number]>;
    referenceProperty?: string;
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

/**
 * Returns the diff between two objects
 * @param {Record<string, any>} prevData - The original object.
 * @param {Record<string, any>} nextData - The new object.
 * @returns ObjectDiff
 */
declare function getObjectDiff(prevData: ObjectData, nextData: ObjectData, options?: ObjectOptions): ObjectDiff;

/**
 * Returns the diff between two arrays
 * @param {Array<T>} prevList - The original array.
 * @param {Array<T>} nextList - The new array.
 * @returns ListDiff
 */
declare const getListDiff: <T>(prevList: T[] | null | undefined, nextList: T[] | null | undefined, options?: ListOptions) => ListDiff;

/**
 * Returns true if two data are equal
 * @param {any} a - The original data.
 * @param {any} b- The data to compare.
 * @returns boolean
 */
declare function isEqual(a: any, b: any, options?: isEqualOptions): boolean;
/**
 * Returns true if the provided value is an object
 * @param {any} value - The data to check.
 * @returns value is Record<string, any>
 */
declare function isObject(value: any): value is Record<string, any>;

export { getListDiff, getObjectDiff, isEqual, isObject };
