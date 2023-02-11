import {
  LIST_STATUS,
  ListData,
  ListDiff,
  ListDiffStatus,
  ListOptions,
} from "./model";
import { isEqual } from "./utils";

function getLeanDiff(
  diff: ListDiff["diff"],
  showOnly = [] as ListOptions["showOnly"]
): ListDiff["diff"] {
  return diff.filter((value) => showOnly?.includes(value.status));
}

function formatSingleListDiff(
  listData: ListData[],
  status: ListDiffStatus,
  options: ListOptions = { showOnly: [] }
): ListDiff {
  const diff = listData.map((data: ListData, i) => ({
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

export const getListDiff = (
  prevList: ListData[] | undefined | null,
  nextList: ListData[] | undefined | null,
  options: ListOptions = { showOnly: [] }
): ListDiff => {
  if (!prevList && !nextList) {
    return {
      type: "list",
      status: LIST_STATUS.EQUAL,
      diff: [],
    };
  }
  if (!prevList) {
    return formatSingleListDiff(
      nextList as ListData,
      LIST_STATUS.ADDED,
      options
    );
  }
  if (!nextList) {
    return formatSingleListDiff(
      prevList as ListData,
      LIST_STATUS.DELETED,
      options
    );
  }
  const diff: ListDiff["diff"] = [];
  const prevIndexMatches: number[] = [];
  nextList.forEach((nextValue, i) => {
    const prevIndex = prevList.findIndex(
      (prevValue, prevIdx) =>
        isEqual(prevValue, nextValue) && !prevIndexMatches.includes(prevIdx)
    );
    if (prevIndex > -1) {
      prevIndexMatches.push(prevIndex);
    }
    const indexDiff = prevIndex === -1 ? null : i - prevIndex;
    if (indexDiff === 0) {
      return diff.push({
        value: nextValue,
        prevIndex,
        newIndex: i,
        indexDiff,
        status: LIST_STATUS.EQUAL,
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
