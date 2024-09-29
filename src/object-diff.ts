import {
  GRANULARITY,
  OBJECT_STATUS,
  ObjectData,
  ObjectDiff,
  ObjectDiffOptions,
  Diff,
  DEFAULT_OBJECT_DIFF_OPTIONS,
} from "./models/object";
import { isEqual, isObject } from "./utils";

function getLeanDiff(
  diff: ObjectDiff["diff"],
  showOnly: ObjectDiffOptions["showOnly"] = DEFAULT_OBJECT_DIFF_OPTIONS.showOnly,
): ObjectDiff["diff"] {
  const { statuses, granularity } = showOnly;
  return diff.reduce(
    (acc, value) => {
      if (granularity === GRANULARITY.DEEP && value.diff) {
        const leanDiff = getLeanDiff(value.diff, showOnly);
        if (leanDiff.length > 0) {
          return [...acc, { ...value, diff: leanDiff }];
        }
      }
      if (statuses.includes(value.status)) {
        return [...acc, value];
      }
      return acc;
    },
    [] as ObjectDiff["diff"],
  );
}

function getObjectStatus(diff: ObjectDiff["diff"]): OBJECT_STATUS {
  return diff.some((property) => property.status !== OBJECT_STATUS.EQUAL)
    ? OBJECT_STATUS.UPDATED
    : OBJECT_STATUS.EQUAL;
}

function formatSingleObjectDiff(
  data: ObjectData,
  status: OBJECT_STATUS,
  options: ObjectDiffOptions = DEFAULT_OBJECT_DIFF_OPTIONS,
): ObjectDiff {
  if (!data) {
    return {
      type: "object",
      status: OBJECT_STATUS.EQUAL,
      diff: [],
    };
  }
  const diff: ObjectDiff["diff"] = [];
  Object.entries(data).forEach(([property, value]) => {
    if (isObject(value)) {
      const subPropertiesDiff: Diff[] = [];
      Object.entries(value).forEach(([subProperty, subValue]) => {
        subPropertiesDiff.push({
          property: subProperty,
          previousValue: status === OBJECT_STATUS.ADDED ? undefined : subValue,
          currentValue: status === OBJECT_STATUS.ADDED ? subValue : undefined,
          status,
        });
      });
      return diff.push({
        property,
        previousValue:
          status === OBJECT_STATUS.ADDED ? undefined : data[property],
        currentValue: status === OBJECT_STATUS.ADDED ? value : undefined,
        status,
        diff: subPropertiesDiff,
      });
    }
    return diff.push({
      property,
      previousValue:
        status === OBJECT_STATUS.ADDED ? undefined : data[property],
      currentValue: status === OBJECT_STATUS.ADDED ? value : undefined,
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
  previousValue: unknown | undefined,
  nextSubProperty: unknown,
  options?: ObjectDiffOptions,
): unknown | undefined {
  if (!previousValue) {
    return undefined;
  }
  const previousMatch = Object.entries(previousValue).find(([subPreviousKey]) =>
    isEqual(subPreviousKey, nextSubProperty, options),
  );
  return previousMatch ? previousMatch[1] : undefined;
}

function getValueStatus(
  previousValue: unknown,
  nextValue: unknown,
  options?: ObjectDiffOptions,
): OBJECT_STATUS {
  if (isEqual(previousValue, nextValue, options)) {
    return OBJECT_STATUS.EQUAL;
  }
  return OBJECT_STATUS.UPDATED;
}

function getPropertyStatus(subPropertiesDiff: Diff[]): OBJECT_STATUS {
  return subPropertiesDiff.some(
    (property) => property.status !== OBJECT_STATUS.EQUAL,
  )
    ? OBJECT_STATUS.UPDATED
    : OBJECT_STATUS.EQUAL;
}

function getDeletedProperties(
  previousValue: Record<string, unknown> | undefined,
  nextValue: Record<string, unknown>,
): { property: string; value: unknown }[] | undefined {
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
  previousValue: Record<string, unknown> | undefined,
  nextValue: Record<string, unknown>,
  options?: ObjectDiffOptions,
): Diff[] {
  const subPropertiesDiff: Diff[] = [];
  let subDiff: Diff[];
  const deletedMainSubProperties = getDeletedProperties(
    previousValue,
    nextValue,
  );
  if (deletedMainSubProperties) {
    deletedMainSubProperties.forEach((deletedProperty) => {
      subPropertiesDiff.push({
        property: deletedProperty.property,
        previousValue: deletedProperty.value,
        currentValue: undefined,
        status: OBJECT_STATUS.DELETED,
      });
    });
  }
  Object.entries(nextValue).forEach(([nextSubProperty, nextSubValue]) => {
    const previousMatch = getPreviousMatch(
      previousValue,
      nextSubProperty,
      options,
    );
    if (!previousMatch) {
      return subPropertiesDiff.push({
        property: nextSubProperty,
        previousValue: previousMatch,
        currentValue: nextSubValue,
        status:
          !previousValue || !(nextSubProperty in previousValue)
            ? OBJECT_STATUS.ADDED
            : previousMatch === nextSubValue
              ? OBJECT_STATUS.EQUAL
              : OBJECT_STATUS.UPDATED,
      });
    }
    if (isObject(nextSubValue)) {
      const data: Diff[] = getSubPropertiesDiff(
        previousMatch as Record<string, unknown>,
        nextSubValue,
        options,
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
        ...(!!subDiff && { diff: subDiff }),
      });
    }
  });
  return subPropertiesDiff;
}

/**
 * Returns the diff between two objects
 * @param {ObjectData} prevData - The original object.
 * @param {ObjectData} nextData - The new object.
 *  * @param {ObjectOptions} options - Options to refine your output.
    - `showOnly`: returns only the values whose status you are interested in. It takes two parameters: `statuses` and `granularity`
       `statuses` are the status you want to see in the output (e.g. `["added", "equal"]`)
      `granularity` can be either `basic` (to return only the main properties whose status matches your query) or `deep` (to return the main properties if some of their subproperties' status match your request. The subproperties are filtered accordingly).
    - `ignoreArrayOrder` if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.
 * @returns ObjectDiff
 */
export function getObjectDiff(
  prevData: ObjectData,
  nextData: ObjectData,
  options: ObjectDiffOptions = DEFAULT_OBJECT_DIFF_OPTIONS,
): ObjectDiff {
  if (!prevData && !nextData) {
    return {
      type: "object",
      status: OBJECT_STATUS.EQUAL,
      diff: [],
    };
  }
  if (!prevData) {
    return formatSingleObjectDiff(nextData, OBJECT_STATUS.ADDED, options);
  }
  if (!nextData) {
    return formatSingleObjectDiff(prevData, OBJECT_STATUS.DELETED, options);
  }
  const diff: ObjectDiff["diff"] = [];
  Object.entries(nextData).forEach(([nextProperty, nextValue]) => {
    const previousValue = prevData[nextProperty];
    if (!previousValue) {
      return diff.push({
        property: nextProperty,
        previousValue,
        currentValue: nextValue,
        status: !(nextProperty in prevData)
          ? OBJECT_STATUS.ADDED
          : previousValue === nextValue
            ? OBJECT_STATUS.EQUAL
            : OBJECT_STATUS.UPDATED,
      });
    }
    if (isObject(nextValue)) {
      const subPropertiesDiff: Diff[] = getSubPropertiesDiff(
        previousValue as Record<string, unknown>,
        nextValue,
        options,
      );
      const subPropertyStatus = getPropertyStatus(subPropertiesDiff);
      return diff.push({
        property: nextProperty,
        previousValue,
        currentValue: nextValue,
        status: subPropertyStatus,
        ...(subPropertyStatus !== OBJECT_STATUS.EQUAL && {
          diff: subPropertiesDiff,
        }),
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
        status: OBJECT_STATUS.DELETED,
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
