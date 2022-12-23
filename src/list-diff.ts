import { STATUS, ListDiff, ListData, DiffStatus } from "./model";
import { isEqual } from "./utils";

function formatSingleListDiff(
  listData: ListData[],
  status: DiffStatus
): ListDiff {
  return {
    type: "list",
    status,
    diff: listData.map((data: ListData, i) => ({
      value: data,
      prevIndex: status === STATUS.ADDED ? null : i,
      newIndex: status === STATUS.ADDED ? i : null,
      indexDiff: null,
      status,
    })),
  };
}

function getListStatus(listDiff: ListDiff["diff"]): DiffStatus {
  return listDiff.some((value) => value.status !== STATUS.EQUAL)
    ? STATUS.UPDATED
    : STATUS.EQUAL;
}

export const getListDiff = (
  prevList: ListData[] | undefined | null,
  nextList: ListData[] | undefined | null
): ListDiff => {
  if (!prevList && !nextList) {
    return {
      type: "list",
      status: STATUS.EQUAL,
      diff: [],
    };
  }
  if (!prevList) {
    return formatSingleListDiff(nextList as ListData, STATUS.ADDED);
  }
  if (!nextList) {
    return formatSingleListDiff(prevList as ListData, STATUS.DELETED);
  }
  const diff: ListDiff["diff"] = [];
  nextList.forEach((nextValue, i) => {
    const prevIndex = prevList.findIndex((prevValue) =>
      isEqual(prevValue, nextValue)
    );
    const indexDiff = prevIndex === -1 ? null : i - prevIndex;
    if (indexDiff === 0) {
      return diff.push({
        value: nextValue,
        prevIndex,
        newIndex: i,
        indexDiff,
        status: STATUS.EQUAL,
      });
    }
    if (prevIndex === -1) {
      return diff.push({
        value: nextValue,
        prevIndex: null,
        newIndex: i,
        indexDiff,
        status: STATUS.ADDED,
      });
    }
    return diff.push({
      value: nextValue,
      prevIndex,
      newIndex: i,
      indexDiff,
      status: STATUS.MOVED,
    });
  });

  prevList.forEach((prevValue, i) => {
    if (!nextList.some((nextValue) => isEqual(nextValue, prevValue))) {
      return diff.splice(i, 0, {
        value: prevValue,
        prevIndex: i,
        newIndex: null,
        indexDiff: null,
        status: STATUS.DELETED,
      });
    }
  });
  return {
    type: "list",
    status: getListStatus(diff),
    diff,
  };
};
