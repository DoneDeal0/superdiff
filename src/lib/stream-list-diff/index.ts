import {
  DEFAULT_LIST_STREAM_OPTIONS,
  ListStreamOptions,
  ReferenceProperty,
  StreamListsDiff,
  StreamReferences,
} from "@models/stream";
import { LIST_STATUS } from "@models/list";
import { isObject } from "@lib/utils";
import {
  Emitter,
  EmitterEvents,
  EventEmitter,
  ReadOnlyEmitter,
  StreamEvent,
} from "./emitter";

function outputDiffChunk<T extends Record<string, unknown>>(
  emitter: Emitter<T>,
) {
  let chunks: StreamListsDiff<T>[] = [];

  return function handleDiffChunk(
    chunk: StreamListsDiff<T>,
    isLastChunk: boolean,
    options: ListStreamOptions,
  ): void {
    const showChunk = options?.showOnly
      ? options?.showOnly.includes(chunk.status)
      : true;
    if (!showChunk) {
      return;
    }
    if ((options.chunksSize as number) > 0) {
      chunks.push(chunk);
      if (chunks.length >= (options.chunksSize as number) || isLastChunk) {
        const output = chunks;
        chunks = [];
        return emitter.emit(StreamEvent.Data, output);
      } else {
        return;
      }
    }
    return emitter.emit(StreamEvent.Data, [chunk]);
  };
}

function formatSingleListStreamDiff<T extends Record<string, unknown>>(
  list: T[],
  isPrevious: boolean,
  status: LIST_STATUS,
  options: ListStreamOptions,
): StreamListsDiff<T>[] | null {
  let isValid = true;
  const diff: StreamListsDiff<T>[] = [];
  for (let i = 0; i < list.length; i++) {
    const data = list[i];
    if (!isObject(data)) {
      isValid = false;
      break;
    }
    diff.push({
      previousValue: isPrevious ? data : null,
      currentValue: isPrevious ? null : data,
      prevIndex: status === LIST_STATUS.ADDED ? null : i,
      newIndex: status === LIST_STATUS.ADDED ? i : null,
      indexDiff: null,
      status,
    });
  }
  if (!isValid) {
    return null;
  }
  if (options.showOnly && options.showOnly.length > 0) {
    return diff.filter((value) => options.showOnly?.includes(value.status));
  }
  return diff;
}

function isValidChunkSize(
  chunksSize: ListStreamOptions["chunksSize"],
): boolean {
  if (!chunksSize) return true;
  const sign = String(Math.sign(chunksSize));
  return sign !== "-1" && sign !== "NaN";
}

function isDataValid<T extends Record<string, unknown>>(
  data: T,
  referenceProperty: ReferenceProperty<T>,
  listType: "prevList" | "nextList",
): { isValid: boolean; message?: string } {
  if (!isObject(data)) {
    return {
      isValid: false,
      message: `Your ${listType} must only contain valid objects. Found '${data}'`,
    };
  }
  if (!Object.hasOwn(data, referenceProperty)) {
    return {
      isValid: false,
      message: `The reference property '${String(referenceProperty)}' is not available in all the objects of your ${listType}.`,
    };
  }
  return {
    isValid: true,
    message: "",
  };
}

function getDiffChunks<T extends Record<string, unknown>>(
  prevList: T[] = [],
  nextList: T[] = [],
  referenceProperty: ReferenceProperty<T>,
  emitter: Emitter<T>,
  options: ListStreamOptions = DEFAULT_LIST_STREAM_OPTIONS,
): void {
  if (!isValidChunkSize(options?.chunksSize)) {
    return emitter.emit(
      StreamEvent.Error,
      new Error(
        `The chunk size can't be negative. You entered the value '${options.chunksSize}'`,
      ),
    );
  }
  if (prevList.length === 0 && nextList.length === 0) {
    return emitter.emit(StreamEvent.Finish);
  }
  const handleDiffChunk = outputDiffChunk<T>(emitter);
  if (prevList.length === 0) {
    const nextDiff = formatSingleListStreamDiff(
      nextList as T[],
      false,
      LIST_STATUS.ADDED,
      options,
    );
    if (!nextDiff) {
      emitter.emit(
        StreamEvent.Error,
        new Error("Your nextList must only contain valid objects."),
      );
      return emitter.emit(StreamEvent.Finish);
    }
    nextDiff?.forEach((data, i) =>
      handleDiffChunk(data, i === nextDiff.length - 1, options),
    );
    return emitter.emit(StreamEvent.Finish);
  }
  if (nextList.length === 0) {
    const prevDiff = formatSingleListStreamDiff(
      prevList as T[],
      true,
      LIST_STATUS.DELETED,
      options,
    );
    if (!prevDiff) {
      emitter.emit(
        StreamEvent.Error,
        new Error("Your prevList must only contain valid objects."),
      );
      return emitter.emit(StreamEvent.Finish);
    }
    prevDiff?.forEach((data, i) =>
      handleDiffChunk(data, i === prevDiff.length - 1, options),
    );
    return emitter.emit(StreamEvent.Finish);
  }
  const listsReferences: StreamReferences<T> = new Map();
  for (let i = 0; i < prevList.length; i++) {
    const data = prevList[i];
    if (data) {
      const { isValid, message } = isDataValid(
        data,
        referenceProperty,
        "prevList",
      );
      if (!isValid) {
        emitter.emit(StreamEvent.Error, new Error(message));
        emitter.emit(StreamEvent.Finish);
        break;
      }
      listsReferences.set(String(data[referenceProperty]), {
        prevIndex: i,
        nextIndex: undefined,
      });
    }
  }

  const totalChunks = listsReferences.size;

  for (let i = 0; i < nextList.length; i++) {
    const data = nextList[i];
    if (data) {
      const { isValid, message } = isDataValid(
        data,
        referenceProperty,
        "nextList",
      );
      if (!isValid) {
        emitter.emit(StreamEvent.Error, new Error(message));
        emitter.emit(StreamEvent.Finish);
        break;
      }
      const listReference = listsReferences.get(
        String(data[referenceProperty]),
      );
      if (listReference) {
        listReference.nextIndex = i;
      } else {
        handleDiffChunk(
          {
            previousValue: null,
            currentValue: data,
            prevIndex: null,
            newIndex: i,
            indexDiff: null,
            status: LIST_STATUS.ADDED,
          },
          totalChunks > 0 ? false : i === nextList.length - 1,
          options,
        );
      }
    }
  }

  let streamedChunks = 0;

  for (const [key, data] of listsReferences.entries()) {
    streamedChunks++;
    const isLastChunk = totalChunks === streamedChunks;

    if (typeof data.nextIndex === "undefined") {
      handleDiffChunk(
        {
          previousValue: prevList[data.prevIndex],
          currentValue: null,
          prevIndex: data.prevIndex,
          newIndex: null,
          indexDiff: null,
          status: LIST_STATUS.DELETED,
        },
        isLastChunk,
        options,
      );
    } else {
      const prevData = prevList[data.prevIndex];
      const nextData = nextList[data.nextIndex];
      const isDataEqual = JSON.stringify(prevData) === JSON.stringify(nextData);
      const indexDiff = data.nextIndex - data.prevIndex;
      if (isDataEqual) {
        if (indexDiff === 0) {
          handleDiffChunk(
            {
              previousValue: prevList[data.prevIndex],
              currentValue: nextList[data.nextIndex],
              prevIndex: data.prevIndex,
              newIndex: data.nextIndex,
              indexDiff: 0,
              status: LIST_STATUS.EQUAL,
            },
            isLastChunk,
            options,
          );
        } else {
          handleDiffChunk(
            {
              previousValue: prevList[data.prevIndex],
              currentValue: nextList[data.nextIndex],
              prevIndex: data.prevIndex,
              newIndex: data.nextIndex,
              indexDiff,
              status: options.considerMoveAsUpdate
                ? LIST_STATUS.UPDATED
                : LIST_STATUS.MOVED,
            },
            isLastChunk,
            options,
          );
        }
      } else {
        handleDiffChunk(
          {
            previousValue: prevList[data.prevIndex],
            currentValue: nextList[data.nextIndex],
            prevIndex: data.prevIndex,
            newIndex: data.nextIndex,
            indexDiff,
            status: LIST_STATUS.UPDATED,
          },
          isLastChunk,
          options,
        );
      }
    }
    listsReferences.delete(key); // to free up memory
  }

  return emitter.emit(StreamEvent.Finish);
}

/**
 * Streams the diff of two object lists
 * @param {Record<string, unknown>[]} prevList - The original object list.
 * @param {Record<string, unknown>[]} nextList - The new object list.
 * @param {ReferenceProperty<T>} referenceProperty - A common property in all the objects of your lists (e.g. `id`)
 * @param {ListStreamOptions} options - Options to refine your output.
    - `chunksSize`: the number of object diffs returned by each stream chunk. If set to `0`, each stream will return a single object diff. If set to `10` each stream will return 10 object diffs. (default is `0`)
    - `showOnly`: returns only the values whose status you are interested in. (e.g. `["added", "equal"]`)
    - `considerMoveAsUpdate`: if set to `true` a `moved` object will be considered as `updated`
 * @returns EventEmitter
 */
export function streamListsDiff<T extends Record<string, unknown>>(
  prevList: T[],
  nextList: T[],
  referenceProperty: ReferenceProperty<T>,
  options: ListStreamOptions = DEFAULT_LIST_STREAM_OPTIONS,
): ReadOnlyEmitter<T> {
  const emitter = new EventEmitter<EmitterEvents<T>>();
  setTimeout(() => {
    try {
      getDiffChunks(prevList, nextList, referenceProperty, emitter, options);
    } catch (err) {
      return emitter.emit(StreamEvent.Error, err as Error);
    }
  }, 0);
  return emitter as ReadOnlyEmitter<T>;
}
