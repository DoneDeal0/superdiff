import {
  ObjectData,
  ObjectDiff,
  DiffStatus,
  STATUS,
  Subproperties,
  Options,
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
  previousValue: any | undefined,
  nextSubProperty: any,
  options?: Options
): any | undefined {
  if (!previousValue) {
    return undefined;
  }
  const previousMatch = Object.entries(previousValue).find(([subPreviousKey]) =>
    isEqual(subPreviousKey, nextSubProperty, options)
  );
  return previousMatch ? previousMatch[1] : undefined;
}

function getValueStatus(
  previousValue: any,
  nextValue: any,
  options?: Options
): DiffStatus {
  if (isEqual(previousValue, nextValue, options)) {
    return STATUS.EQUAL;
  }
  return STATUS.UPDATED;
}

function getPropertyStatus(subPropertiesDiff: Subproperties[]): DiffStatus {
  return subPropertiesDiff.some((property) => property.status !== STATUS.EQUAL)
    ? STATUS.UPDATED
    : STATUS.EQUAL;
}

function getDeletedProperties(
  previousValue: Record<string, any> | undefined,
  nextValue: Record<string, any>
): { property: string; value: any }[] | undefined {
  if (!previousValue) return undefined;
  const prevKeys = Object.keys(previousValue);
  const nextKeys = Object.keys(nextValue);
  const deletedKeys = prevKeys.filter((prevKey) => !nextKeys.includes(prevKey));
  if (deletedKeys.length > 0) {
    return deletedKeys.map((deletedKey) => ({
      property: deletedKey,
      value: previousValue[deletedKey],
    }));
  }
  return undefined;
}

function getSubPropertiesDiff(
  previousValue: Record<string, any> | undefined,
  nextValue: Record<string, any>,
  options?: Options
): Subproperties[] {
  const subPropertiesDiff: Subproperties[] = [];
  let subDiff: Subproperties[];
  const deletedMainSubProperties = getDeletedProperties(
    previousValue,
    nextValue
  );
  if (deletedMainSubProperties) {
    deletedMainSubProperties.forEach((deletedProperty) => {
      subPropertiesDiff.push({
        name: deletedProperty.property,
        previousValue: deletedProperty.value,
        currentValue: undefined,
        status: STATUS.DELETED,
      });
    });
  }
  Object.entries(nextValue).forEach(([nextSubProperty, nextSubValue]) => {
    const previousMatch = getPreviousMatch(
      previousValue,
      nextSubProperty,
      options
    );
    if (!!!previousMatch && !!nextSubProperty) {
      return subPropertiesDiff.push({
        name: nextSubProperty,
        previousValue: undefined,
        currentValue: nextSubValue,
        status: STATUS.ADDED,
      });
    }
    if (isObject(nextSubValue)) {
      const data: Subproperties[] = getSubPropertiesDiff(
        previousMatch,
        nextSubValue,
        options
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
        status: getValueStatus(previousMatch, nextSubValue, options),
        ...(!!subDiff && { subDiff }),
      });
    }
  });
  return subPropertiesDiff;
}

export function getObjectDiff(
  prevData: ObjectData,
  nextData: ObjectData,
  options?: Options
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
    if (!!!previousValue) {
      return diff.push({
        property: nextProperty,
        previousValue: undefined,
        currentValue: nextValue,
        status: STATUS.ADDED,
      });
    }
    if (isObject(nextValue)) {
      const subPropertiesDiff: Subproperties[] = getSubPropertiesDiff(
        previousValue,
        nextValue,
        options
      );
      return diff.push({
        property: nextProperty,
        previousValue,
        currentValue: nextValue,
        status: getPropertyStatus(subPropertiesDiff),
        subPropertiesDiff,
      });
    }
    return diff.push({
      property: nextProperty,
      previousValue,
      currentValue: nextValue,
      status: getValueStatus(previousValue, nextValue, options),
    });
  });
  const deletedProperties = getDeletedProperties(prevData, nextData);
  if (deletedProperties) {
    deletedProperties.forEach((deletedProperty) => {
      diff.push({
        property: deletedProperty.property,
        previousValue: deletedProperty.value,
        currentValue: undefined,
        status: STATUS.DELETED,
      });
    });
  }
  return {
    type: "object",
    status: getObjectStatus(diff),
    diff,
  };
}
