import {
  ObjectData,
  ObjectDiff,
  DiffStatus,
  STATUS,
  Subproperties,
} from "./model";
import { hasNestedValues, isEqual } from "./utils";

function formatSingleObjectDiff(
  data: ObjectData,
  status: DiffStatus
): ObjectDiff {
  const diff: ObjectDiff["diff"] = [];
  Object.entries(data).forEach(([property, value]) => {
    if (hasNestedValues(value)) {
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
    diff,
  };
}

export function getObjectDiff(
  prevData: ObjectData,
  nextData: ObjectData
): ObjectDiff {
  if (!prevData && !nextData) {
    return {
      type: "object",
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

    if (hasNestedValues(nextValue)) {
      const prevSubValues = previousValue
        ? Object.entries(previousValue)
        : null;
      const subPropertiesDiff: Subproperties[] = [];
      Object.entries(nextValue).forEach(([nextSubProperty, nextSubValue]) => {
        if (prevSubValues) {
          const previousMatch = prevSubValues.find(([subPreviousKey]) =>
            isEqual(subPreviousKey, nextSubProperty)
          );
          if (previousMatch) {
            subPropertiesDiff.push({
              name: nextSubProperty,
              previousValue: previousMatch[1],
              currentValue: nextSubValue,
              status: isEqual(previousMatch[1], nextSubValue)
                ? STATUS.EQUAL
                : STATUS.UPDATED,
            });
          }
        }
      });
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
    diff,
  };
}
