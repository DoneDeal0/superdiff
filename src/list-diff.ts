import { STATUS, ListDiff, ListData, DiffStatus } from "./model";
import { isEqual } from "./utils";

function formatSingleListDiff(
  listData: ListData[],
  status: DiffStatus
): ListDiff {
  console.log("formatsingle", listData);
  return {
    type: "list",
    diff: listData.map((data: ListData, i) => ({
      value: data,
      prevIndex: status === STATUS.ADDED ? null : i,
      newIndex: status === STATUS.ADDED ? i : null,
      indexDiff: null,
      status,
    })),
  };
}

export const getListDiff = (
  prevList: ListData[] | undefined | null,
  nextList: ListData[] | undefined | null
): ListDiff => {
  if (!prevList && !nextList) {
    return {
      type: "list",
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
    diff,
  };
};

export function hasListChanged(listDiff: ListDiff): boolean {
  return listDiff.diff.some((d) => d.status !== STATUS.EQUAL);
}
