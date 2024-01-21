import {
  LIST_STATUS,
  ListData,
  ListDiff,
  ListDiffStatus,
  ListOptions,
} from "./model";
import { isEqual, isObject } from "./utils";

function getLeanDiff(
  diff: ListDiff["diff"],
  showOnly = [] as ListOptions["showOnly"]
): ListDiff["diff"] {
  return diff.filter((value) => showOnly?.includes(value.status));
}

function formatSingleListDiff<T>(
  listData: T[],
  status: ListDiffStatus,
  options: ListOptions = { showOnly: [] }
): ListDiff {
  const diff = listData.map((data, i) => ({
    value: data,
    prevIndex: status === LIST_STATUS.ADDED ? null : i,
    newIndex: status === LIST_STATUS.ADDED ? i : null,
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

function getListStatus(listDiff: ListDiff["diff"]): ListDiffStatus {
  return listDiff.some((value) => value.status !== LIST_STATUS.EQUAL)
    ? LIST_STATUS.UPDATED
    : LIST_STATUS.EQUAL;
}

function isReferencedObject(
  value: any,
  referenceProperty: ListOptions["referenceProperty"]
): value is Record<string, any> {
  if (isObject(value) && !!referenceProperty) {
    return Object.hasOwn(value, referenceProperty);
  }
  return false;
}

/**
 * Returns the diff between two arrays
 * @param {Array<T>} prevList - The original array.
 * @param {Array<T>} nextList - The new array.
 * @returns ListDiff
 */
export const getListDiff = <T>(
  prevList: T[] | undefined | null,
  nextList: T[] | undefined | null,
  options: ListOptions = { showOnly: [], referenceProperty: undefined }
): ListDiff => {
  if (!prevList && !nextList) {
    return {
      type: "list",
      status: LIST_STATUS.EQUAL,
      diff: [],
    };
  }
  if (!prevList) {
    return formatSingleListDiff(nextList as T[], LIST_STATUS.ADDED, options);
  }
  if (!nextList) {
    return formatSingleListDiff(prevList as T[], LIST_STATUS.DELETED, options);
  }
  const diff: ListDiff["diff"] = [];
  const prevIndexMatches: number[] = [];
  nextList.forEach((nextValue, i) => {
    const prevIndex = prevList.findIndex((prevValue, prevIdx) => {
      if (isReferencedObject(prevValue, options.referenceProperty)) {
        if (isObject(nextValue)) {
          return (
            isEqual(
              prevValue[options.referenceProperty as string],
              nextValue[options.referenceProperty as string]
            ) && !prevIndexMatches.includes(prevIdx)
          );
        }
        return false;
      }
      return (
        isEqual(prevValue, nextValue) && !prevIndexMatches.includes(prevIdx)
      );
    });
    if (prevIndex > -1) {
      prevIndexMatches.push(prevIndex);
    }
    const indexDiff = prevIndex === -1 ? null : i - prevIndex;
    if (indexDiff === 0) {
      let nextStatus = LIST_STATUS.EQUAL;
      if (isReferencedObject(nextValue, options.referenceProperty)) {
        if (!isEqual(prevList[prevIndex], nextValue)) {
          nextStatus = LIST_STATUS.UPDATED;
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
        status: LIST_STATUS.ADDED,
      });
    }
    return diff.push({
      value: nextValue,
      prevIndex,
      newIndex: i,
      indexDiff,
      status: LIST_STATUS.MOVED,
    });
  });

  prevList.forEach((prevValue, i) => {
    if (!prevIndexMatches.includes(i)) {
      return diff.splice(i, 0, {
        value: prevValue,
        prevIndex: i,
        newIndex: null,
        indexDiff: null,
        status: LIST_STATUS.DELETED,
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
