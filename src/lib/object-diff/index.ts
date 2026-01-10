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
  const authorizedStatuses = new Set(statuses);
  const res: ObjectDiff["diff"] = [];
  const isDeep = granularity === Granularity.DEEP;
  for (let i = 0; i < diff.length; i++) {
    const entry = diff[i];
    if (isDeep && entry.diff) {
      const sub = getLeanDiff(entry.diff, showOnly);
      if (sub.length > 0) {
        res.push({
          property: entry.property,
          previousValue: entry.previousValue,
          currentValue: entry.currentValue,
          status: entry.status,
          diff: sub,
        });
      }
      continue;
    }
    if (authorizedStatuses.has(entry.status)) {
      res.push(entry);
    }
  }
  return res;
}

function getObjectStatus(diff: ObjectDiff["diff"]): ObjectStatus {
  for (let i = 0; i < diff.length; i++) {
    if (diff[i].status !== ObjectStatus.EQUAL) {
      return ObjectStatus.UPDATED;
    }
  }
  return ObjectStatus.EQUAL;
}

function formatSingleObjectDiff(
  data: ObjectData,
  status: ObjectStatus,
  options: ObjectDiffOptions = DEFAULT_OBJECT_DIFF_OPTIONS,
): ObjectDiff {
  if (!data) {
    return { type: "object", status: ObjectStatus.EQUAL, diff: [] };
  }
  const diff: ObjectDiff["diff"] = [];
  const added = status === ObjectStatus.ADDED;
  for (const key in data) {
    const value = data[key];
    if (isObject(value)) {
      const sub: Diff[] = [];
      for (const subKey in value) {
        sub.push({
          property: subKey,
          previousValue: added ? undefined : value[subKey],
          currentValue: added ? value[subKey] : undefined,
          status,
        });
      }
      diff.push({
        property: key,
        previousValue: added ? undefined : data[key],
        currentValue: added ? value : undefined,
        status,
        diff: sub,
      });
    } else {
      diff.push({
        property: key,
        previousValue: added ? undefined : data[key],
        currentValue: added ? value : undefined,
        status,
      });
    }
  }
  const showOnly = options.showOnly;
  if (showOnly && showOnly.statuses.length > 0) {
    return { type: "object", status, diff: getLeanDiff(diff, showOnly) };
  }
  return { type: "object", status, diff };
}

function getDiff(
  prevData: Record<string, unknown> = {},
  nextData: Record<string, unknown>,
  options?: ObjectDiffOptions,
): Diff[] {
  const diff: Diff[] = [];

  for (const key in prevData) {
    const prevVal = prevData[key];

    if (!Object.prototype.hasOwnProperty.call(nextData, key)) {
      diff.push({
        property: key,
        previousValue: prevVal,
        currentValue: undefined,
        status: ObjectStatus.DELETED,
      });
      continue;
    }

    const nextVal = nextData[key];

    if (isObject(prevVal) && isObject(nextVal)) {
      const subDiff = getDiff(prevVal, nextVal, options);
      let updated = false;

      for (let i = 0; i < subDiff.length; i++) {
        if (subDiff[i].status !== ObjectStatus.EQUAL) {
          updated = true;
          break;
        }
      }

      diff.push(
        updated
          ? {
              property: key,
              previousValue: prevVal,
              currentValue: nextVal,
              status: ObjectStatus.UPDATED,
              diff: subDiff,
            }
          : {
              property: key,
              previousValue: prevVal,
              currentValue: nextVal,
              status: ObjectStatus.EQUAL,
            },
      );
    } else {
      const status = isEqual(prevVal, nextVal, options)
        ? ObjectStatus.EQUAL
        : ObjectStatus.UPDATED;

      diff.push({
        property: key,
        previousValue: prevVal,
        currentValue: nextVal,
        status,
      });
    }
  }

  for (const key in nextData) {
    if (Object.prototype.hasOwnProperty.call(prevData, key)) continue;
    diff.push({
      property: key,
      previousValue: undefined,
      currentValue: nextData[key],
      status: ObjectStatus.ADDED,
    });
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
