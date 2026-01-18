import { createReadStream } from "fs";
import { Readable, Transform } from "stream";
import { Worker } from "worker_threads";
import { IEmitter, EmitterEvents, EventEmitter } from "@models/emitter";
import { ListStatus, ListType } from "@models/list";
import {
  DataBuffer,
  DEFAULT_LIST_STREAM_OPTIONS,
  FilePath,
  ListStreamOptions,
  ReferenceKey,
  StreamEvent,
  StreamListener,
} from "@models/stream";
import { isDataValid, isValidChunkSize, outputDiffChunk } from "../utils";
import { generateWorker } from "./worker/utils";

async function getDiffChunks<T extends Record<string, unknown>>(
  prevStream: Readable,
  nextStream: Readable,
  referenceKey: ReferenceKey<T>,
  emitter: IEmitter<T>,
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
      referenceKey,
      ListType.PREV,
    );
    if (!isValid) {
      emitter.emit(StreamEvent.Error, new Error(message));
      emitter.emit(StreamEvent.Finish);
      return;
    }
    const ref = chunk[referenceKey] as ReferenceKey<T>;
    const relatedChunk = nextDataBuffer.get(ref);

    if (relatedChunk) {
      nextDataBuffer.delete(ref);
      const isDataEqual =
        JSON.stringify(chunk) === JSON.stringify(relatedChunk.data);
      const isEqual = (relatedChunk.index as number) - currentPrevIndex === 0;
      if (isDataEqual) {
        handleDiffChunk(
          {
            value: relatedChunk.data,
            index: relatedChunk.index,
            previousValue: chunk,
            previousIndex: currentPrevIndex,
            status: isEqual
              ? ListStatus.EQUAL
              : options.considerMoveAsUpdate
                ? ListStatus.UPDATED
                : ListStatus.MOVED,
          },
          options,
        );
      } else {
        handleDiffChunk(
          {
            value: relatedChunk.data,
            index: relatedChunk.index,
            previousValue: chunk,
            previousIndex: currentPrevIndex,
            status: ListStatus.UPDATED,
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
      referenceKey,
      ListType.NEXT,
    );
    if (!isValid) {
      emitter.emit(StreamEvent.Error, new Error(message));
      emitter.emit(StreamEvent.Finish);
      return;
    }
    const ref = chunk[referenceKey] as ReferenceKey<T>;
    const relatedChunk = prevDataBuffer.get(ref);

    if (relatedChunk) {
      prevDataBuffer.delete(ref);
      const isDataEqual =
        JSON.stringify(chunk) === JSON.stringify(relatedChunk.data);
      const isEqual = currentNextIndex - (relatedChunk.index as number) === 0;
      if (isDataEqual) {
        handleDiffChunk(
          {
            value: chunk,
            index: currentNextIndex,
            previousValue: relatedChunk.data,
            previousIndex: relatedChunk.index,
            status: isEqual
              ? ListStatus.EQUAL
              : options.considerMoveAsUpdate
                ? ListStatus.UPDATED
                : ListStatus.MOVED,
          },
          options,
        );
      } else {
        handleDiffChunk(
          {
            value: chunk,
            index: currentNextIndex,
            previousValue: relatedChunk.data,
            previousIndex: relatedChunk.index,
            status: ListStatus.UPDATED,
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
        value: null,
        index: null,
        previousValue: chunk.data,
        previousIndex: chunk.index,
        status: ListStatus.DELETED,
      },
      options,
    );
    prevDataBuffer.delete(key);
  }
  for (const [key, chunk] of nextDataBuffer.entries()) {
    handleDiffChunk(
      {
        value: chunk.data,
        index: chunk.index,
        previousValue: null,
        previousIndex: null,
        status: ListStatus.ADDED,
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
  listType: ListType,
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

export async function generateStream<T extends Record<string, unknown>>(
  prevList: Readable | FilePath | T[],
  nextList: Readable | FilePath | T[],
  referenceKey: ReferenceKey<T>,
  options: ListStreamOptions,
  emitter: IEmitter<T>,
): Promise<void> {
  try {
    const [prevStream, nextStream] = await Promise.all([
      getValidStream(prevList, ListType.PREV),
      getValidStream(nextList, ListType.NEXT),
    ]);
    getDiffChunks(prevStream, nextStream, referenceKey, emitter, options);
  } catch (err) {
    return emitter.emit(StreamEvent.Error, err as Error);
  }
}

/**
 * Streams the diff of two object lists
 * @param {Readable | FilePath | Record<string, unknown>[]} prevList - The original object list.
 * @param {Readable | FilePath | Record<string, unknown>[]} nextList - The new object list.
 * @param {string} referenceKey - A common key in all the objects of your lists (e.g. `id`)
 * @param {ListStreamOptions} options - Options to refine your output.
    - `chunksSize`: the number of object diffs returned by each streamed chunk. (e.g. `0` = 1 object diff by chunk, `10` = 10 object diffs by chunk).
    - `showOnly`: returns only the values whose status you are interested in. (e.g. `["added", "equal"]`).
    - `considerMoveAsUpdate`: if set to `true` a `moved` object will be considered as `updated`.
    - `useWorker`: if set to `true`, the diff will be run in a worker. Recommended for maximum performance, `true` by default.
    - `showWarnings`: if set to `true`, potential warnings will be displayed in the console. 
 * @returns StreamListener
 */
export function streamListDiff<T extends Record<string, unknown>>(
  prevList: Readable | FilePath | T[],
  nextList: Readable | FilePath | T[],
  referenceKey: ReferenceKey<T>,
  options: ListStreamOptions = DEFAULT_LIST_STREAM_OPTIONS,
): StreamListener<T> {
  const emitter = new EventEmitter<EmitterEvents<T>>();
  if (typeof Worker === "undefined" || !options.useWorker) {
    setTimeout(
      () => generateStream(prevList, nextList, referenceKey, options, emitter),
      0,
    );
  } else {
    generateWorker(prevList, nextList, referenceKey, options, emitter);
  }
  return emitter as StreamListener<T>;
}
