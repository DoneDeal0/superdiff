import { isEqual, isObject } from "@lib/utils";
import {
  DEFAULT_LIST_DIFF_OPTIONS,
  ListStatus,
  ListDiff,
  ListDiffOptions,
  ListData,
} from "@models/list";

function getDiffStatus(statusMap: Set<ListStatus>): ListStatus {
  if (statusMap.has(ListStatus.UPDATED)) return ListStatus.UPDATED;
  const isUnique = (status: ListStatus) => {
    for (const s of statusMap) if (s !== status) return false;
    return true;
  };
  if (isUnique(ListStatus.ADDED)) return ListStatus.ADDED;
  if (isUnique(ListStatus.DELETED)) return ListStatus.DELETED;
  if (isUnique(ListStatus.EQUAL)) return ListStatus.EQUAL;
  return ListStatus.UPDATED;
}

function getLeanDiff(
  diff: ListDiff["diff"],
  showOnly: ListDiffOptions["showOnly"] = [],
): ListDiff["diff"] {
  const set = new Set(showOnly);
  const leanDiff: ListDiff["diff"] = [];
  for (let i = 0; i < diff.length; i++) {
    if (set.has(diff[i].status)) {
      leanDiff.push(diff[i]);
    }
  }
  return leanDiff;
}

function formatSingleListDiff<T>(
  listData: T[],
  status: ListStatus,
  options: ListDiffOptions,
): ListDiff {
  const diff: ListDiff["diff"] = new Array(listData.length);
  const isAdded = status === ListStatus.ADDED;
  for (let i = 0; i < listData.length; i++) {
    diff[i] = {
      value: listData[i],
      prevIndex: isAdded ? null : i,
      newIndex: isAdded ? i : null,
      indexDiff: null,
      status,
    };
  }
  if (options.showOnly && options.showOnly.length > 0) {
    return {
      type: "list",
      status,
      diff: getLeanDiff(diff, options.showOnly),
    };
  }
  return { type: "list", status, diff };
}

function getNextStatus(
  indexDiff: number,
  isStrictEqual: boolean,
  options: ListDiffOptions,
): ListStatus {
  if (indexDiff === 0) {
    return isStrictEqual ? ListStatus.EQUAL : ListStatus.UPDATED;
  }
  if (options.ignoreArrayOrder && isStrictEqual) {
    return ListStatus.EQUAL;
  }
  return options.considerMoveAsUpdate || !isStrictEqual
    ? ListStatus.UPDATED
    : ListStatus.MOVED;
}

/**
 * Returns the diff between two arrays
 * @param {Array<T>} prevList - The original array.
 * @param {Array<T>} nextList - The new array.
 * @param {ListOptions} options - Options to refine your output.
    - `showOnly` gives you the option to return only the values whose status you are interested in (e.g. `["added", "equal"]`).
    - `referenceProperty` will consider an object to be updated instead of added or deleted if one of its properties remains stable, such as its `id`. This option has no effect on other datatypes.
    - `considerMoveAsUpdate` if set to `true` a `moved` value will be considered as `updated`.
    - `ignoreArrayOrder` if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.
 * @returns ListDiff
 */
export const getListDiff = <T>(
  prevList: T[] | undefined | null,
  nextList: T[] | undefined | null,
  options: ListDiffOptions = DEFAULT_LIST_DIFF_OPTIONS,
): ListDiff => {
  if (!prevList && !nextList) {
    return { type: "list", status: ListStatus.EQUAL, diff: [] };
  }
  if (!prevList) {
    return formatSingleListDiff(nextList as T[], ListStatus.ADDED, options);
  }
  if (!nextList) {
    return formatSingleListDiff(prevList as T[], ListStatus.DELETED, options);
  }

  const diff: ListDiff["diff"] = [];
  const previousMap = new Map<string, ListData<T>>();
  const statusMap = new Set<ListStatus>();
  const { referenceProperty, ignoreArrayOrder } = options;
  let containsArrays = false;

  const stableStringifyCache = new Map<unknown, string>();

  function stableStringifyCached(value: unknown): string {
    const cached = stableStringifyCache.get(value);
    if (cached !== undefined) return cached;
    const result = stableStringify(value);
    stableStringifyCache.set(value, result);
    return result;
  }

  function stableStringify(value: unknown): string {
    if (isObject(value)) {
      const keys = Object.keys(value).sort();
      let res = "{";
      for (let i = 0; i < keys.length; i++) {
        const data = keys[i];
        res += JSON.stringify(data) + ":" + stableStringify(value[data]);
        if (i < keys.length - 1) res += ",";
      }
      return res + "}";
    }
    if (Array.isArray(value)) {
      let res = "[";
      for (let i = 0; i < value.length; i++) {
        res += stableStringify(value[i]);
        if (i < value.length - 1) res += ",";
      }
      return res + "]";
    }
    if (value === undefined) return "undefined";
    return JSON.stringify(value);
  }

  for (let i = 0; i < prevList.length; i++) {
    const prevValue = prevList[i];
    if (ignoreArrayOrder && !containsArrays && Array.isArray(prevValue)) {
      containsArrays = true;
    }
    let reference: string;

    if (
      referenceProperty &&
      isObject(prevValue) &&
      referenceProperty in prevValue
    ) {
      reference = stableStringifyCached(prevValue[referenceProperty]);
    } else {
      reference = stableStringifyCached(prevValue);
    }

    const match = previousMap.get(reference);
    if (match) {
      match.indexes.push(i);
    } else {
      previousMap.set(reference, { value: prevValue, indexes: [i] });
    }
  }

  const getPreviousMatch = (nextValue: T) => {
    let reference: string;
    let previousMatch: ListData<T> | undefined;
    let isStrictEqual = false;

    if (
      referenceProperty &&
      isObject(nextValue) &&
      referenceProperty in nextValue
    ) {
      reference = stableStringifyCached(nextValue[referenceProperty]);
      previousMatch = previousMap.get(reference);
      if (previousMatch) {
        isStrictEqual = isEqual(previousMatch.value, nextValue, {
          ignoreArrayOrder,
        });
      }
    } else {
      reference = stableStringifyCached(nextValue);
      previousMatch = previousMap.get(reference);

      if (!previousMatch && ignoreArrayOrder && containsArrays) {
        for (const prev of previousMap.values()) {
          if (isEqual(prev.value, nextValue, { ignoreArrayOrder })) {
            previousMatch = prev;
            break;
          }
        }
      }

      if (previousMatch) {
        isStrictEqual = true;
      }
    }

    return { previousMatch, reference, isStrictEqual };
  };

  const injectNextValueInDiff = (
    nextValue: T,
    previousMatch: ListData<T> | undefined,
    nextIndex: number,
    reference: string,
    isStrictEqual: boolean,
  ) => {
    if (previousMatch) {
      const prevIndex = previousMatch.indexes[0];
      const indexDiff = nextIndex - prevIndex;
      const nextStatus = getNextStatus(indexDiff, isStrictEqual, options);

      diff.push({
        value: nextValue,
        prevIndex,
        newIndex: nextIndex,
        indexDiff,
        status: nextStatus,
      });
      statusMap.add(nextStatus);

      previousMatch.indexes.shift();
      if (previousMatch.indexes.length === 0) {
        previousMap.delete(reference);
      }
    } else {
      diff.push({
        value: nextValue,
        prevIndex: null,
        newIndex: nextIndex,
        indexDiff: null,
        status: ListStatus.ADDED,
      });
      statusMap.add(ListStatus.ADDED);
    }
  };

  for (let i = 0; i < nextList.length; i++) {
    const nextValue = nextList[i];
    const { previousMatch, reference, isStrictEqual } =
      getPreviousMatch(nextValue);
    injectNextValueInDiff(
      nextValue,
      previousMatch,
      i,
      reference,
      isStrictEqual,
    );
  }

  for (const prevData of previousMap.values()) {
    statusMap.add(ListStatus.DELETED);
    for (let i = 0; i < prevData.indexes.length; i++) {
      diff.push({
        value: prevData.value,
        prevIndex: prevData.indexes[i],
        newIndex: null,
        indexDiff: null,
        status: ListStatus.DELETED,
      });
    }
  }

  const finalStatus = getDiffStatus(statusMap);

  if (options.showOnly && options.showOnly.length > 0) {
    return {
      type: "list",
      status: finalStatus,
      diff: getLeanDiff(diff, options.showOnly),
    };
  }

  return { type: "list", status: finalStatus, diff };
};
