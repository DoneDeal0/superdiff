import {
  GRANULARITY,
  STATUS,
  ObjectData,
  ObjectDiff,
  ObjectDiffStatus,
  ObjectOptions,
  SubProperties,
} from "./model";
import { isEqual, isObject } from "./utils";

function getLeanDiff(
  diff: ObjectDiff["diff"],
  showOnly: ObjectOptions["showOnly"] = {
    statuses: [],
    granularity: GRANULARITY.BASIC,
  }
): ObjectDiff["diff"] {
  const { statuses, granularity } = showOnly;
  return diff.reduce((acc, value) => {
    if (granularity === GRANULARITY.DEEP && value.subPropertiesDiff) {
      const cleanSubPropertiesDiff = getLeanDiff(
        value.subPropertiesDiff,
        showOnly
      );
      if (cleanSubPropertiesDiff.length > 0) {
        return [
          ...acc,
          { ...value, subPropertiesDiff: cleanSubPropertiesDiff },
        ];
      }
    }
    // @ts-ignore
    if (granularity === GRANULARITY.DEEP && value.subDiff) {
      // @ts-ignore
      const cleanSubDiff = getLeanDiff(value.subDiff, showOnly);
      if (cleanSubDiff.length > 0) {
        return [...acc, { ...value, subDiff: cleanSubDiff }];
      }
    }
    if (statuses.includes(value.status)) {
      return [...acc, value];
    }
    return acc;
  }, [] as ObjectDiff["diff"]);
}

function getObjectStatus(diff: ObjectDiff["diff"]): ObjectDiffStatus {
  return diff.some((property) => property.status !== STATUS.EQUAL)
    ? STATUS.UPDATED
    : STATUS.EQUAL;
}

function formatSingleObjectDiff(
  data: ObjectData,
  status: ObjectDiffStatus,
  options: ObjectOptions = {
    ignoreArrayOrder: false,
    showOnly: { statuses: [], granularity: GRANULARITY.BASIC },
  }
): ObjectDiff {
  if (!data) {
    return {
      type: "object",
      status: STATUS.EQUAL,
      diff: [],
    };
  }
  const diff: ObjectDiff["diff"] = [];
  Object.entries(data).forEach(([property, value]) => {
    if (isObject(value)) {
      const subPropertiesDiff: SubProperties[] = [];
      Object.entries(value).forEach(([subProperty, subValue]) => {
        subPropertiesDiff.push({
          property: subProperty,
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
  if (options.showOnly && options.showOnly.statuses.length > 0) {
    return {
      type: "object",
      status,
      diff: getLeanDiff(diff, options.showOnly),
    };
  }
  return {
    type: "object",
    status,
    diff,
  };
}

function getPreviousMatch(
  previousValue: any | undefined,
  nextSubProperty: any,
  options?: ObjectOptions
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
  options?: ObjectOptions
): ObjectDiffStatus {
  if (isEqual(previousValue, nextValue, options)) {
    return STATUS.EQUAL;
  }
  return STATUS.UPDATED;
}

function getPropertyStatus(
  subPropertiesDiff: SubProperties[]
): ObjectDiffStatus {
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
  options?: ObjectOptions
): SubProperties[] {
  const subPropertiesDiff: SubProperties[] = [];
  let subDiff: SubProperties[];
  const deletedMainSubProperties = getDeletedProperties(
    previousValue,
    nextValue
  );
  if (deletedMainSubProperties) {
    deletedMainSubProperties.forEach((deletedProperty) => {
      subPropertiesDiff.push({
        property: deletedProperty.property,
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
    if (!!!previousMatch) {
      return subPropertiesDiff.push({
        property: nextSubProperty,
        previousValue: previousMatch,
        currentValue: nextSubValue,
        status:
          !previousValue || !(nextSubProperty in previousValue)
            ? STATUS.ADDED
            : previousMatch === nextSubValue
            ? STATUS.EQUAL
            : STATUS.UPDATED,
      });
    }
    if (isObject(nextSubValue)) {
      const data: SubProperties[] = getSubPropertiesDiff(
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
        property: nextSubProperty,
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
  options: ObjectOptions = {
    ignoreArrayOrder: false,
    showOnly: { statuses: [], granularity: GRANULARITY.BASIC },
  }
): ObjectDiff {
  if (!prevData && !nextData) {
    return {
      type: "object",
      status: STATUS.EQUAL,
      diff: [],
    };
  }
  if (!prevData) {
    return formatSingleObjectDiff(nextData, STATUS.ADDED, options);
  }
  if (!nextData) {
    return formatSingleObjectDiff(prevData, STATUS.DELETED, options);
  }
  const diff: ObjectDiff["diff"] = [];
  Object.entries(nextData).forEach(([nextProperty, nextValue]) => {
    const previousValue = prevData[nextProperty];
    if (!!!previousValue) {
      return diff.push({
        property: nextProperty,
        previousValue,
        currentValue: nextValue,
        status: !(nextProperty in prevData)
          ? STATUS.ADDED
          : previousValue === nextValue
          ? STATUS.EQUAL
          : STATUS.UPDATED,
      });
    }
    if (isObject(nextValue)) {
      const subPropertiesDiff: SubProperties[] = getSubPropertiesDiff(
        previousValue,
        nextValue,
        options
      );
      const subPropertyStatus = getPropertyStatus(subPropertiesDiff);
      return diff.push({
        property: nextProperty,
        previousValue,
        currentValue: nextValue,
        status: subPropertyStatus,
        ...(subPropertyStatus !== STATUS.EQUAL && { subPropertiesDiff }),
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
  if (options.showOnly && options.showOnly.statuses.length > 0) {
    return {
      type: "object",
      status: getObjectStatus(diff),
      diff: getLeanDiff(diff, options.showOnly),
    };
  }
  return {
    type: "object",
    status: getObjectStatus(diff),
    diff,
  };
}
