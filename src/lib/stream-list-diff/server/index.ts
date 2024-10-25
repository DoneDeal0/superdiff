import { createReadStream } from "fs";
import { Readable, Transform } from "stream";
import { LIST_STATUS } from "@models/list";
import {
  DataBuffer,
  DEFAULT_LIST_STREAM_OPTIONS,
  FilePath,
  ListStreamOptions,
  ReferenceProperty,
} from "@models/stream";
import {
  Emitter,
  EmitterEvents,
  EventEmitter,
  StreamListener,
  StreamEvent,
} from "../emitter";
import { isDataValid, isValidChunkSize, outputDiffChunk } from "../utils";

async function getDiffChunks<T extends Record<string, unknown>>(
  prevStream: Readable,
  nextStream: Readable,
  referenceProperty: ReferenceProperty<T>,
  emitter: Emitter<T>,
  options: ListStreamOptions = DEFAULT_LIST_STREAM_OPTIONS,
): Promise<void> {
  if (!isValidChunkSize(options?.chunksSize)) {
    return emitter.emit(
      StreamEvent.Error,
      new Error(
        `The chunk size can't be negative. You entered the value '${options.chunksSize}'`,
      ),
    );
  }
  const { handleDiffChunk, releaseLastChunks } = outputDiffChunk<T>(emitter);
  const prevDataBuffer: DataBuffer<T> = new Map();
  const nextDataBuffer: DataBuffer<T> = new Map();
  let currentPrevIndex = 0;
  let currentNextIndex = 0;

  async function processPrevStreamChunk(chunk: T) {
    const { isValid, message } = isDataValid(
      chunk,
      referenceProperty,
      "prevList",
    );
    if (!isValid) {
      emitter.emit(StreamEvent.Error, new Error(message));
      emitter.emit(StreamEvent.Finish);
      return;
    }
    const ref = chunk[referenceProperty] as ReferenceProperty<T>;
    const relatedChunk = nextDataBuffer.get(ref);

    if (relatedChunk) {
      nextDataBuffer.delete(ref);
      const isDataEqual =
        JSON.stringify(chunk) === JSON.stringify(relatedChunk.data);
      const indexDiff = (relatedChunk.index as number) - currentPrevIndex;
      if (isDataEqual) {
        handleDiffChunk(
          {
            previousValue: chunk,
            currentValue: relatedChunk.data,
            prevIndex: currentPrevIndex,
            newIndex: relatedChunk.index,
            indexDiff,
            status:
              indexDiff === 0
                ? LIST_STATUS.EQUAL
                : options.considerMoveAsUpdate
                  ? LIST_STATUS.UPDATED
                  : LIST_STATUS.MOVED,
          },
          options,
        );
      } else {
        handleDiffChunk(
          {
            previousValue: chunk,
            currentValue: relatedChunk.data,
            prevIndex: currentPrevIndex,
            newIndex: relatedChunk.index,
            indexDiff,
            status: LIST_STATUS.UPDATED,
          },
          options,
        );
      }
    } else {
      prevDataBuffer.set(ref, { data: chunk, index: currentPrevIndex });
    }
    currentPrevIndex++;
  }

  async function processNextStreamChunk(chunk: T) {
    const { isValid, message } = isDataValid(
      chunk,
      referenceProperty,
      "nextList",
    );
    if (!isValid) {
      emitter.emit(StreamEvent.Error, new Error(message));
      emitter.emit(StreamEvent.Finish);
      return;
    }
    const ref = chunk[referenceProperty] as ReferenceProperty<T>;
    const relatedChunk = prevDataBuffer.get(ref);

    if (relatedChunk) {
      prevDataBuffer.delete(ref);
      const isDataEqual =
        JSON.stringify(chunk) === JSON.stringify(relatedChunk.data);
      const indexDiff = currentNextIndex - (relatedChunk.index as number);
      if (isDataEqual) {
        handleDiffChunk(
          {
            previousValue: relatedChunk.data,
            currentValue: chunk,
            prevIndex: relatedChunk.index,
            newIndex: currentNextIndex,
            indexDiff,
            status:
              indexDiff === 0
                ? LIST_STATUS.EQUAL
                : options.considerMoveAsUpdate
                  ? LIST_STATUS.UPDATED
                  : LIST_STATUS.MOVED,
          },
          options,
        );
      } else {
        handleDiffChunk(
          {
            previousValue: relatedChunk.data,
            currentValue: chunk,
            prevIndex: relatedChunk.index,
            newIndex: currentNextIndex,
            indexDiff,
            status: LIST_STATUS.UPDATED,
          },
          options,
        );
      }
    } else {
      nextDataBuffer.set(ref, { data: chunk, index: currentNextIndex });
    }
    currentNextIndex++;
  }

  const prevStreamReader = async () => {
    for await (const chunk of prevStream) {
      await processPrevStreamChunk(chunk);
    }
  };

  const nextStreamReader = async () => {
    for await (const chunk of nextStream) {
      await processNextStreamChunk(chunk);
    }
  };
  await Promise.all([prevStreamReader(), nextStreamReader()]);

  for (const [key, chunk] of prevDataBuffer.entries()) {
    handleDiffChunk(
      {
        previousValue: chunk.data,
        currentValue: null,
        prevIndex: chunk.index,
        newIndex: null,
        indexDiff: null,
        status: LIST_STATUS.DELETED,
      },
      options,
    );
    prevDataBuffer.delete(key);
  }
  for (const [key, chunk] of nextDataBuffer.entries()) {
    handleDiffChunk(
      {
        previousValue: null,
        currentValue: chunk.data,
        prevIndex: null,
        newIndex: chunk.index,
        indexDiff: null,
        status: LIST_STATUS.ADDED,
      },
      options,
    );
    nextDataBuffer.delete(key);
  }
  releaseLastChunks();
  return emitter.emit(StreamEvent.Finish);
}

function getValidStream<T>(
  input: Readable | FilePath | T[],
  listType: "prevList" | "nextList",
): Readable {
  if (input instanceof Readable) {
    return input;
  }

  if (Array.isArray(input)) {
    return Readable.from(input, { objectMode: true });
  }

  if (typeof input === "string") {
    return createReadStream(input, { encoding: "utf8" }).pipe(
      new Transform({
        objectMode: true,
        transform(chunk, _, callback) {
          try {
            const data: T = JSON.parse(chunk.toString());
            if (Array.isArray(data)) {
              for (let i = 0; i < data.length; i++) {
                this.push(data[i]);
              }
            } else {
              this.push(data);
            }
            callback();
          } catch (err) {
            callback(err as Error);
          }
        },
      }),
    );
  }

  throw new Error(`Invalid ${listType}. Expected Readable, Array, or File.`);
}

/**
 * Streams the diff of two object lists
 * @param {Readable | FilePath | Record<string, unknown>[]} prevList - The original object list.
 * @param {Readable | FilePath | Record<string, unknown>[]} nextList - The new object list.
 * @param {string} referenceProperty - A common property in all the objects of your lists (e.g. `id`)
 * @param {ListStreamOptions} options - Options to refine your output.
    - `chunksSize`: the number of object diffs returned by each streamed chunk. (e.g. `0` = 1 object diff by chunk, `10` = 10 object diffs by chunk).
    - `showOnly`: returns only the values whose status you are interested in. (e.g. `["added", "equal"]`)
    - `considerMoveAsUpdate`: if set to `true` a `moved` object will be considered as `updated`
 * @returns StreamListener
 */
export function streamListDiff<T extends Record<string, unknown>>(
  prevStream: Readable | FilePath | T[],
  nextStream: Readable | FilePath | T[],
  referenceProperty: ReferenceProperty<T>,
  options: ListStreamOptions = DEFAULT_LIST_STREAM_OPTIONS,
): StreamListener<T> {
  const emitter = new EventEmitter<EmitterEvents<T>>();
  setTimeout(async () => {
    try {
      await getDiffChunks(
        getValidStream(prevStream, "prevList"),
        getValidStream(nextStream, "nextList"),
        referenceProperty,
        emitter,
        options,
      );
    } catch (err) {
      return emitter.emit(StreamEvent.Error, err as Error);
    }
  }, 0);
  return emitter as StreamListener<T>;
}
