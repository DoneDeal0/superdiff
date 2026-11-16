import { isEqual, isObject, stableStringify } from "@lib/utils";
import {
  DEFAULT_LIST_DIFF_OPTIONS,
  ListStatus,
  ListDiff,
  ListDiffOptions,
} from "@models/list";

function getDiffStatus(statusMap: Set<ListStatus>): ListStatus {
  if (statusMap.size === 0) return ListStatus.EQUAL;
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

function getLeanDiff<T>(
  diff: ListDiff<T>["diff"],
  showOnly: ListDiffOptions["showOnly"] = [],
): ListDiff<T>["diff"] {
  const set = new Set(showOnly);
  const leanDiff: ListDiff<T>["diff"] = [];
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
  options: ListDiffOptions<T>,
): ListDiff<T> {
  const diff: ListDiff<T>["diff"] = new Array(listData.length);
  const isAdded = status === ListStatus.ADDED;
  for (let i = 0; i < listData.length; i++) {
    diff[i] = {
      value: listData[i],
      previousIndex: isAdded ? null : i,
      index: isAdded ? i : null,
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
    - `referenceKey` will consider an object to be updated instead of added or deleted if one of its keys remains stable, such as its `id`. This option has no effect on other datatypes.
    - `considerMoveAsUpdate` if set to `true` a `moved` value will be considered as `updated`.
    - `ignoreArrayOrder` if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.
 * @returns ListDiff
 */
export const getListDiff = <T>(
  prevList: T[] | undefined | null,
  nextList: T[] | undefined | null,
  options: ListDiffOptions<T> = DEFAULT_LIST_DIFF_OPTIONS,
): ListDiff<T> => {
  if (!prevList && !nextList) {
    return { type: "list", status: ListStatus.EQUAL, diff: [] };
  }
  if (!prevList) {
    return formatSingleListDiff(nextList as T[], ListStatus.ADDED, options);
  }
  if (!nextList) {
    return formatSingleListDiff(prevList as T[], ListStatus.DELETED, options);
  }

  const diff: ListDiff<T>["diff"] = [];
  const previousMap = new Map<unknown, { indexes: number[]; cursor: number }>();
  const statusMap = new Set<ListStatus>();
  const { referenceKey, ignoreArrayOrder } = options;
  const stringifyCache = new Map<unknown, string>();
  const unorderedCache = ignoreArrayOrder
    ? new Map<unknown, string>()
    : stringifyCache;

  function stableStringifyCached(value: unknown, unordered = ignoreArrayOrder) {
    const cache = unordered ? unorderedCache : stringifyCache;
    const cached = cache.get(value);
    if (cached !== undefined) return cached;
    const result = stableStringify(value, unordered);
    cache.set(value, result);
    return result;
  }

  function getMatchKey(value: T): unknown {
    if (
      referenceKey !== undefined &&
      isObject(value) &&
      referenceKey in value
    ) {
      return `key:${stableStringifyCached(value[referenceKey], false)}`;
    }

    return (typeof value === "object" && value !== null) ||
      typeof value === "string"
      ? stableStringifyCached(value)
      : value;
  }

  for (let i = 0; i < prevList.length; i++) {
    const reference = getMatchKey(prevList[i]);
    const match = previousMap.get(reference);
    if (match) {
      match.indexes.push(i);
    } else {
      previousMap.set(reference, { indexes: [i], cursor: 0 });
    }
  }

  for (let i = 0; i < nextList.length; i++) {
    const nextValue = nextList[i];
    const reference = getMatchKey(nextValue);
    const previousMatch = previousMap.get(reference);

    if (previousMatch) {
      const previousIndex = previousMatch.indexes[previousMatch.cursor++];
      const isStrictEqual =
        referenceKey === undefined ||
        !isObject(nextValue) ||
        !(referenceKey in nextValue) ||
        isEqual(prevList[previousIndex], nextValue, options);
      const status = getNextStatus(i - previousIndex, isStrictEqual, options);
      diff.push({ value: nextValue, previousIndex, index: i, status });
      statusMap.add(status);

      if (previousMatch.cursor === previousMatch.indexes.length) {
        previousMap.delete(reference);
      }
    } else {
      diff.push({
        value: nextValue,
        previousIndex: null,
        index: i,
        status: ListStatus.ADDED,
      });
      statusMap.add(ListStatus.ADDED);
    }
  }

  for (const previousMatch of previousMap.values()) {
    statusMap.add(ListStatus.DELETED);
    for (let i = previousMatch.cursor; i < previousMatch.indexes.length; i++) {
      const previousIndex = previousMatch.indexes[i];
      diff.push({
        value: prevList[previousIndex],
        previousIndex,
        index: null,
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
