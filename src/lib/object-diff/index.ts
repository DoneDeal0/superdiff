import { isEqual, isObject } from "@lib/utils";
import {
  Granularity,
  ObjectStatus,
  ObjectData,
  ObjectDiff,
  ObjectDiffOptions,
  Diff,
  DEFAULT_OBJECT_DIFF_OPTIONS,
} from "@models/object";

function getLeanDiff(
  diff: ObjectDiff["diff"],
  showOnly: ObjectDiffOptions["showOnly"] = DEFAULT_OBJECT_DIFF_OPTIONS.showOnly,
): ObjectDiff["diff"] {
  const { statuses, granularity } = showOnly;
  const res: ObjectDiff["diff"] = [];
  for (let i = 0; i < diff.length; i++) {
    const value = diff[i];
    if (granularity === Granularity.DEEP && value.diff) {
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

function getObjectStatus(diff: ObjectDiff["diff"]): ObjectStatus {
  return diff.some((property) => property.status !== ObjectStatus.EQUAL)
    ? ObjectStatus.UPDATED
    : ObjectStatus.EQUAL;
}

function formatSingleObjectDiff(
  data: ObjectData,
  status: ObjectStatus,
  options: ObjectDiffOptions = DEFAULT_OBJECT_DIFF_OPTIONS,
): ObjectDiff {
  if (!data) {
    return {
      type: "object",
      status: ObjectStatus.EQUAL,
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
          previousValue: status === ObjectStatus.ADDED ? undefined : subValue,
          currentValue: status === ObjectStatus.ADDED ? subValue : undefined,
          status,
        });
      }
      diff.push({
        property,
        previousValue:
          status === ObjectStatus.ADDED ? undefined : data[property],
        currentValue: status === ObjectStatus.ADDED ? value : undefined,
        status,
        diff: subPropertiesDiff,
      });
    } else {
      diff.push({
        property,
        previousValue:
          status === ObjectStatus.ADDED ? undefined : data[property],
        currentValue: status === ObjectStatus.ADDED ? value : undefined,
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
): ObjectStatus {
  if (isEqual(previousValue, nextValue, options)) {
    return ObjectStatus.EQUAL;
  }
  return ObjectStatus.UPDATED;
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
        status: ObjectStatus.DELETED,
      });
      continue;
    }
    if (!(property in previousValue)) {
      diff.push({
        property,
        previousValue: undefined,
        currentValue: nextSubValue,
        status: ObjectStatus.ADDED,
      });
      continue;
    }
    if (isObject(nextSubValue) && isObject(prevSubValue)) {
      const subDiff = getDiff(prevSubValue, nextSubValue, options);
      const isUpdated = subDiff.some(
        (entry) => entry.status !== ObjectStatus.EQUAL,
      );
      diff.push({
        property,
        previousValue: prevSubValue,
        currentValue: nextSubValue,
        status: isUpdated ? ObjectStatus.UPDATED : ObjectStatus.EQUAL,
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
      status: ObjectStatus.EQUAL,
      diff: [],
    };
  }
  if (!prevData) {
    return formatSingleObjectDiff(nextData, ObjectStatus.ADDED, options);
  }
  if (!nextData) {
    return formatSingleObjectDiff(prevData, ObjectStatus.DELETED, options);
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
