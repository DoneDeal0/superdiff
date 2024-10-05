import {
  DEFAULT_LIST_STREAM_OPTIONS,
  ListStreamOptions,
  ReferenceProperty,
  StreamListsDiff,
  StreamReferences,
} from "@models/stream";
import { LIST_STATUS } from "@models/list";
import { isEqual } from "@lib/utils";
import { EventEmitter, StreamEvent } from "./emitter";

function outputDiffChunk<T extends Record<string, unknown>>(
  emitter: EventEmitter,
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
): StreamListsDiff<T>[] {
  const diff: StreamListsDiff<T>[] = list.map((data, i) => ({
    previousValue: isPrevious ? data : null,
    currentValue: isPrevious ? null : data,
    prevIndex: status === LIST_STATUS.ADDED ? null : i,
    newIndex: status === LIST_STATUS.ADDED ? i : null,
    indexDiff: null,
    status,
  }));
  if (options.showOnly && options.showOnly.length > 0) {
    return diff.filter((value) => options.showOnly?.includes(value.status));
  }
  return diff;
}

function isValidChunkSize(
  chunksSize: ListStreamOptions["chunksSize"],
): boolean {
  if (!chunksSize) return true;
  const x = String(Math.sign(chunksSize));
  return x !== "-1" && x !== "NaN";
}

function getDiffChunks<T extends Record<string, unknown>>(
  prevList: T[],
  nextList: T[],
  referenceProperty: ReferenceProperty<T>,
  emitter: EventEmitter,
  options: ListStreamOptions = DEFAULT_LIST_STREAM_OPTIONS,
) {
  if (!isValidChunkSize(options?.chunksSize)) {
    return emitter.emit(
      StreamEvent.Error,
      `The chunk size can't be negative. You entered the value ${options.chunksSize}`,
    );
  }
  if (!prevList && !nextList) {
    return [];
  }
  if (!prevList) {
    const nextDiff = formatSingleListStreamDiff(
      nextList as T[],
      false,
      LIST_STATUS.ADDED,
      options,
    );
    return nextDiff.forEach((data, i) =>
      handleDiffChunk(data, i === nextDiff.length - 1, options),
    );
  }
  if (!nextList) {
    const prevDiff = formatSingleListStreamDiff(
      prevList as T[],
      true,
      LIST_STATUS.DELETED,
      options,
    );
    return prevDiff.forEach((data, i) =>
      handleDiffChunk(data, i === prevDiff.length - 1, options),
    );
  }
  const listsReferences: StreamReferences<T> = new Map();
  const handleDiffChunk = outputDiffChunk<T>(emitter);
  prevList.forEach((data, i) => {
    if (data) {
      listsReferences.set(String(data[referenceProperty]), {
        prevIndex: i,
        nextIndex: undefined,
      });
    }
  });

  nextList.forEach((data, i) => {
    if (data) {
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
          i === nextList.length - 1,
          options,
        );
      }
    }
  });
  let streamedChunks = 0;
  const totalChunks = listsReferences.size;
  for (const data of listsReferences.values()) {
    streamedChunks++;
    const isLastChunk = totalChunks === streamedChunks;
    if (!data.nextIndex) {
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
      const isDataEqual = isEqual(prevData, nextData);
      const indexDiff = data.prevIndex - data.nextIndex;
      if (isDataEqual) {
        if (indexDiff === 0) {
          handleDiffChunk(
            {
              previousValue: prevList[data.prevIndex],
              currentValue: nextList[data.nextIndex],
              prevIndex: null,
              newIndex: data.nextIndex,
              indexDiff: null,
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
): EventEmitter {
  const emitter = new EventEmitter();
  setTimeout(() => {
    try {
      getDiffChunks(prevList, nextList, referenceProperty, emitter, options);
    } catch (err) {
      return emitter.emit(StreamEvent.Error, err);
    }
  }, 0);
  return emitter;
}
