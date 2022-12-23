import {
  ObjectData,
  ObjectDiff,
  DiffStatus,
  STATUS,
  Subproperties,
} from "./model";
import { isObject, isEqual } from "./utils";

function getObjectStatus(diff: ObjectDiff["diff"]): DiffStatus {
  return diff.some((property) => property.status !== STATUS.EQUAL)
    ? STATUS.UPDATED
    : STATUS.EQUAL;
}

function formatSingleObjectDiff(
  data: ObjectData,
  status: DiffStatus
): ObjectDiff {
  if (!data) {
    return {
      type: "object",
      status: STATUS.isEqual,
      diff: [],
    };
  }
  const diff: ObjectDiff["diff"] = [];
  Object.entries(data).forEach(([property, value]) => {
    if (isObject(value)) {
      const subPropertiesDiff: Subproperties[] = [];
      Object.entries(value).forEach(([subProperty, subValue]) => {
        subPropertiesDiff.push({
          name: subProperty,
          previousValue: status === STATUS.ADDED ? undefined : subValue,
          currentValue: status === STATUS.ADDED ? subValue : undefined,
          status,
        });
      });
      return diff.push({
        property: property,
        previousValue: status === STATUS.ADDED ? undefined : data[property],
        currentValue: status === STATUS.ADDED ? value : undefined,
        status,
        subPropertiesDiff,
      });
    }
    return diff.push({
      property,
      previousValue: status === STATUS.ADDED ? undefined : data[property],
      currentValue: status === STATUS.ADDED ? value : undefined,
      status,
    });
  });
  return {
    type: "object",
    status,
    diff,
  };
}

function getPreviousMatch(
  prevSubValues: [string, any][] | null,
  nextSubProperty: any
): any | undefined {
  if (!prevSubValues) {
    return undefined;
  }
  const previousMatch = prevSubValues.find(([subPreviousKey]) =>
    isEqual(subPreviousKey, nextSubProperty)
  );
  return previousMatch ? previousMatch[1] : undefined;
}

function getSubPropertiesDiff(
  previousValue: Record<string, any> | undefined,
  nextValue: Record<string, any>
): Subproperties[] {
  const subPropertiesDiff: Subproperties[] = [];
  const prevSubValues = previousValue ? Object.entries(previousValue) : null;
  let subDiff: Subproperties["subDiff"];
  Object.entries(nextValue).forEach(([nextSubProperty, nextSubValue]) => {
    const previousMatch = getPreviousMatch(prevSubValues, nextSubProperty);
    if (isObject(nextSubValue)) {
      const data: Subproperties[] = getSubPropertiesDiff(
        previousMatch,
        nextSubValue
      );
      if (data && data.length > 0) {
        subDiff = data;
      }
    }
    if (previousMatch) {
      subPropertiesDiff.push({
        name: nextSubProperty,
        previousValue: previousMatch,
        currentValue: nextSubValue,
        status: isEqual(previousMatch, nextSubValue)
          ? STATUS.EQUAL
          : STATUS.UPDATED,
        ...(!!subDiff && { subDiff }),
      });
    }
  });
  return subPropertiesDiff;
}

export function getObjectDiff(
  prevData: ObjectData,
  nextData: ObjectData
): ObjectDiff {
  if (!prevData && !nextData) {
    return {
      type: "object",
      status: STATUS.EQUAL,
      diff: [],
    };
  }
  if (!prevData) {
    return formatSingleObjectDiff(nextData, STATUS.ADDED);
  }
  if (!nextData) {
    return formatSingleObjectDiff(prevData, STATUS.DELETED);
  }
  const diff: ObjectDiff["diff"] = [];
  Object.entries(nextData).forEach(([nextProperty, nextValue]) => {
    const previousValue = prevData[nextProperty];

    if (isObject(nextValue)) {
      const subPropertiesDiff: Subproperties[] = getSubPropertiesDiff(
        previousValue,
        nextValue
      );
      const _status = subPropertiesDiff.some(
        (property) => property.status !== STATUS.EQUAL
      )
        ? STATUS.UPDATED
        : STATUS.EQUAL;
      return diff.push({
        property: nextProperty,
        previousValue,
        currentValue: nextValue,
        status: _status,
        subPropertiesDiff,
      });
    }
    return diff.push({
      property: nextProperty,
      previousValue,
      currentValue: nextValue,
      status: previousValue === nextValue ? STATUS.EQUAL : STATUS.UPDATED,
    });
  });
  return {
    type: "object",
    status: getObjectStatus(diff),
    diff,
  };
}
