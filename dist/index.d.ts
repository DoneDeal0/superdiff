declare const STATUS: Record<string, ObjectDiffStatus>;
declare const LIST_STATUS: Record<string, ListDiffStatus>;
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
    considerMoveAsUpdate?: boolean;
    ignoreArrayOrder?: boolean;
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
type DataDiff = ListDiff | ObjectDiff;

/**
 * Returns the diff between two objects
 * @param {Record<string, any>} prevData - The original object.
 * @param {Record<string, any>} nextData - The new object.
 *  * @param {ListOptions} options - Options to refine your output.
    - `showOnly`: returns only the values whose status you are interested in. It takes two parameters: `statuses` and `granularity`
       `statuses` are the status you want to see in the output (e.g. `["added", "equal"]`)
      `granularity` can be either `basic` (to return only the main properties whose status matches your query) or `deep` (to return the main properties if some of their subproperties' status match your request. The subproperties are filtered accordingly).
    - `ignoreArrayOrder` if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.
 * @returns ObjectDiff
 */
declare function getObjectDiff(prevData: ObjectData, nextData: ObjectData, options?: ObjectOptions): ObjectDiff;

/**
 * Returns the diff between two arrays
 * @param {Array<T>} prevList - The original array.
 * @param {Array<T>} nextList - The new array.
 * @param {ListOptions} options - Options to refine your output.
    - `showOnly` gives you the option to return only the values whose status you are interested in (e.g. `["added", "equal"]`).
    - `referenceProperty` will consider an object to be updated instead of added or deleted if one of its properties remains stable, such as its `id`. This option has no effect on other datatypes.
 * @returns ListDiff
 */
declare const getListDiff: <T>(prevList: T[] | undefined | null, nextList: T[] | undefined | null, options?: ListOptions) => ListDiff;

/**
 * Returns true if two data are equal
 * @param {any} a - The original data.
 * @param {any} b - The data to compare.
 * @param {isEqualOptions} options - The options to compare the data.
 * @returns boolean
 */
declare function isEqual(a: any, b: any, options?: isEqualOptions): boolean;
/**
 * Returns true if the provided value is an object
 * @param {any} value - The data to check.
 * @returns value is Record<string, any>
 */
declare function isObject(value: any): value is Record<string, any>;

export { type DataDiff, GRANULARITY, LIST_STATUS, type ListData, type ListDiff, type ListDiffStatus, type ListOptions, type ListStatusTuple, type ObjectData, type ObjectDiff, type ObjectDiffStatus, type ObjectOptions, type ObjectStatusTuple, STATUS, type SubProperties, getListDiff, getObjectDiff, isEqual, type isEqualOptions, isObject };
