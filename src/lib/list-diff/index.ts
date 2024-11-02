import { isEqual, isObject } from "@lib/utils";
import {
  DEFAULT_LIST_DIFF_OPTIONS,
  ListStatus,
  ListDiff,
  ListDiffOptions,
} from "@models/list";

function getLeanDiff(
  diff: ListDiff["diff"],
  showOnly = [] as ListDiffOptions["showOnly"],
): ListDiff["diff"] {
  return diff.filter((value) => showOnly?.includes(value.status));
}

function formatSingleListDiff<T>(
  listData: T[],
  status: ListStatus,
  options: ListDiffOptions = { showOnly: [] },
): ListDiff {
  const diff = listData.map((data, i) => ({
    value: data,
    prevIndex: status === ListStatus.ADDED ? null : i,
    newIndex: status === ListStatus.ADDED ? i : null,
    indexDiff: null,
    status,
  }));
  if (options.showOnly && options.showOnly.length > 0) {
    return {
      type: "list",
      status,
      diff: diff.filter((value) => options.showOnly?.includes(value.status)),
    };
  }
  return {
    type: "list",
    status,
    diff,
  };
}

function getListStatus(listDiff: ListDiff["diff"]): ListStatus {
  return listDiff.some((value) => value.status !== ListStatus.EQUAL)
    ? ListStatus.UPDATED
    : ListStatus.EQUAL;
}

function isReferencedObject(
  value: unknown,
  referenceProperty: ListDiffOptions["referenceProperty"],
): value is Record<string, unknown> {
  if (isObject(value) && !!referenceProperty) {
    return Object.hasOwn(value, referenceProperty);
  }
  return false;
}

/**
 * Returns the diff between two arrays
 * @param {Array<T>} prevList - The original array.
 * @param {Array<T>} nextList - The new array.
 * @param {ListOptions} options - Options to refine your output.
    - `showOnly` gives you the option to return only the values whose status you are interested in (e.g. `["added", "equal"]`).
    - `referenceProperty` will consider an object to be updated instead of added or deleted if one of its properties remains stable, such as its `id`. This option has no effect on other datatypes.
 * @returns ListDiff
 */
export const getListDiff = <T>(
  prevList: T[] | undefined | null,
  nextList: T[] | undefined | null,
  options: ListDiffOptions = DEFAULT_LIST_DIFF_OPTIONS,
): ListDiff => {
  if (!prevList && !nextList) {
    return {
      type: "list",
      status: ListStatus.EQUAL,
      diff: [],
    };
  }
  if (!prevList) {
    return formatSingleListDiff(nextList as T[], ListStatus.ADDED, options);
  }
  if (!nextList) {
    return formatSingleListDiff(prevList as T[], ListStatus.DELETED, options);
  }
  const diff: ListDiff["diff"] = [];
  const prevIndexMatches = new Set<number>();

  nextList.forEach((nextValue, i) => {
    const prevIndex = prevList.findIndex((prevValue, prevIdx) => {
      if (prevIndexMatches.has(prevIdx)) {
        return false;
      }
      if (isReferencedObject(prevValue, options.referenceProperty)) {
        if (isObject(nextValue)) {
          return isEqual(
            prevValue[options.referenceProperty as string],
            nextValue[options.referenceProperty as string],
          );
        }
        return false;
      }
      return isEqual(prevValue, nextValue);
    });
    if (prevIndex > -1) {
      prevIndexMatches.add(prevIndex);
    }
    const indexDiff = prevIndex === -1 ? null : i - prevIndex;
    if (indexDiff === 0 || options.ignoreArrayOrder) {
      let nextStatus = ListStatus.EQUAL;
      if (isReferencedObject(nextValue, options.referenceProperty)) {
        if (!isEqual(prevList[prevIndex], nextValue)) {
          nextStatus = ListStatus.UPDATED;
        }
      }
      return diff.push({
        value: nextValue,
        prevIndex,
        newIndex: i,
        indexDiff,
        status: nextStatus,
      });
    }
    if (prevIndex === -1) {
      return diff.push({
        value: nextValue,
        prevIndex: null,
        newIndex: i,
        indexDiff,
        status: ListStatus.ADDED,
      });
    }
    return diff.push({
      value: nextValue,
      prevIndex,
      newIndex: i,
      indexDiff,
      status: options.considerMoveAsUpdate
        ? ListStatus.UPDATED
        : ListStatus.MOVED,
    });
  });

  prevList.forEach((prevValue, i) => {
    if (!prevIndexMatches.has(i)) {
      return diff.push({
        value: prevValue,
        prevIndex: i,
        newIndex: null,
        indexDiff: null,
        status: ListStatus.DELETED,
      });
    }
  });
  if (options.showOnly && options?.showOnly?.length > 0) {
    return {
      type: "list",
      status: getListStatus(diff),
      diff: getLeanDiff(diff, options.showOnly),
    };
  }
  return {
    type: "list",
    status: getListStatus(diff),
    diff,
  };
};
