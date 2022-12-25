type DiffStatus = "added" | "equal" | "moved" | "deleted" | "updated";
type ObjectData = Record<string, any> | undefined | null;
type ListData = any;
type ListDiff = {
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
type Subproperties = {
    name: string;
    previousValue: any;
    currentValue: any;
    status: DiffStatus;
    subDiff?: Subproperties[];
};
type ObjectDiff = {
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

declare function getObjectDiff(prevData: ObjectData, nextData: ObjectData): ObjectDiff;

declare const getListDiff: (prevList: ListData[] | undefined | null, nextList: ListData[] | undefined | null) => ListDiff;

declare function isEqual(a: any, b: any): boolean;
declare function isObject(value: any): value is Record<string, any>;

export { getListDiff, getObjectDiff, isEqual, isObject };
