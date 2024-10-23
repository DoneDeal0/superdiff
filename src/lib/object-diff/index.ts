import {
  GRANULARITY,
  OBJECT_STATUS,
  ObjectData,
  ObjectDiff,
  ObjectDiffOptions,
  Diff,
  DEFAULT_OBJECT_DIFF_OPTIONS,
} from "@models/object";
import { isEqual, isObject } from "@lib/utils";

function getLeanDiff(
  diff: ObjectDiff["diff"],
  showOnly: ObjectDiffOptions["showOnly"] = DEFAULT_OBJECT_DIFF_OPTIONS.showOnly,
): ObjectDiff["diff"] {
  const { statuses, granularity } = showOnly;
  const res: ObjectDiff["diff"] = [];
  for (let i = 0; i < diff.length; i++) {
    const value = diff[i];
    if (granularity === GRANULARITY.DEEP && value.diff) {
      const leanDiff = getLeanDiff(value.diff, showOnly);
      if (leanDiff.length > 0) {
        res.push({ ...value, diff: leanDiff });
      }
    } else if (statuses.includes(value.status)) {
      res.push(value);
    }
  }
  return res;
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

  for (const [property, value] of Object.entries(data)) {
    if (isObject(value)) {
      const subPropertiesDiff: Diff[] = [];
      for (const [subProperty, subValue] of Object.entries(value)) {
        subPropertiesDiff.push({
          property: subProperty,
          previousValue: status === OBJECT_STATUS.ADDED ? undefined : subValue,
          currentValue: status === OBJECT_STATUS.ADDED ? subValue : undefined,
          status,
        });
      }
      diff.push({
        property,
        previousValue:
          status === OBJECT_STATUS.ADDED ? undefined : data[property],
        currentValue: status === OBJECT_STATUS.ADDED ? value : undefined,
        status,
        diff: subPropertiesDiff,
      });
    } else {
      diff.push({
        property,
        previousValue:
          status === OBJECT_STATUS.ADDED ? undefined : data[property],
        currentValue: status === OBJECT_STATUS.ADDED ? value : undefined,
        status,
      });
    }
  }

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

function getDiff(
  previousValue: Record<string, unknown> | undefined = {},
  nextValue: Record<string, unknown>,
  options?: ObjectDiffOptions,
): Diff[] {
  const diff: Diff[] = [];
  const allKeys = new Set([
    ...Object.keys(previousValue),
    ...Object.keys(nextValue),
  ]);

  for (const property of allKeys) {
    const prevSubValue = previousValue[property];
    const nextSubValue = nextValue[property];
    if (!(property in nextValue)) {
      diff.push({
        property,
        previousValue: prevSubValue,
        currentValue: undefined,
        status: OBJECT_STATUS.DELETED,
      });
      continue;
    }
    if (!(property in previousValue)) {
      diff.push({
        property,
        previousValue: undefined,
        currentValue: nextSubValue,
        status: OBJECT_STATUS.ADDED,
      });
      continue;
    }
    if (isObject(nextSubValue) && isObject(prevSubValue)) {
      const subDiff = getDiff(prevSubValue, nextSubValue, options);
      const isUpdated = subDiff.some(
        (entry) => entry.status !== OBJECT_STATUS.EQUAL,
      );
      diff.push({
        property,
        previousValue: prevSubValue,
        currentValue: nextSubValue,
        status: isUpdated ? OBJECT_STATUS.UPDATED : OBJECT_STATUS.EQUAL,
        ...(isUpdated && { diff: subDiff }),
      });
    } else {
      const status = getValueStatus(prevSubValue, nextSubValue, options);
      diff.push({
        property,
        previousValue: prevSubValue,
        currentValue: nextSubValue,
        status,
      });
    }
  }
  return diff;
}

/**
 * Returns the diff between two objects
 * @param {ObjectData} prevData - The original object.
 * @param {ObjectData} nextData - The new object.
 * @param {ObjectOptions} options - Options to refine your output.
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
  const diff: ObjectDiff["diff"] = getDiff(prevData, nextData, options);
  const status = getObjectStatus(diff);
  const showLeanDiff = (options?.showOnly?.statuses?.length || 0) > 0;
  return {
    type: "object",
    status,
    diff: showLeanDiff ? getLeanDiff(diff, options.showOnly) : diff,
  };
}
