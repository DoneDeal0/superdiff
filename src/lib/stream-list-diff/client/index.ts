import { IEmitter, EmitterEvents, EventEmitter } from "@models/emitter";
import {
  DataBuffer,
  DEFAULT_LIST_STREAM_OPTIONS,
  ListStreamOptions,
  ReferenceKey,
  StreamEvent,
  StreamListener,
} from "@models/stream";
import { ListStatus, ListType } from "@models/list";
import { isDataValid, isValidChunkSize, outputDiffChunk } from "../utils";
import { generateWorker } from "./worker/utils";

async function getDiffChunks<T extends Record<string, unknown>>(
  prevStream: ReadableStream<T>,
  nextStream: ReadableStream<T>,
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

  const prevList = prevStream.getReader();
  const nextList = nextStream.getReader();
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

  const readStream = async (
    reader: ReadableStreamDefaultReader<T>,
    processChunk: (chunk: T) => Promise<void>,
  ) => {
    let result;
    while (!(result = await reader.read()).done) {
      await processChunk(result.value);
    }
  };

  await Promise.all([
    readStream(prevList, async (chunk) => {
      await processPrevStreamChunk(chunk);
    }),
    readStream(nextList, async (chunk) => {
      await processNextStreamChunk(chunk);
    }),
  ]);

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

async function getValidClientStream<T extends Record<string, unknown>>(
  input: ReadableStream<T> | T[] | File,
  listType: ListType,
): Promise<ReadableStream<T>> {
  if (input instanceof ReadableStream) {
    return input;
  }
  let nextInput = input;
  if (input instanceof File) {
    const fileText = await input.text();
    try {
      nextInput = JSON.parse(fileText);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_: unknown) {
      throw new Error(`Your ${listType} is not a valid JSON array.`);
    }

    if (!Array.isArray(nextInput)) {
      throw new Error(`Your ${listType} is not a JSON array.`);
    }
  }

  if (Array.isArray(nextInput)) {
    return new ReadableStream({
      start(controller) {
        nextInput.forEach((item) => controller.enqueue(item));
        controller.close();
      },
    });
  }

  throw new Error(
    `Invalid ${listType}. Expected ReadableStream, Array, or File.`,
  );
}

export async function generateStream<T extends Record<string, unknown>>(
  prevList: ReadableStream<T> | File | T[],
  nextList: ReadableStream<T> | File | T[],
  referenceKey: ReferenceKey<T>,
  options: ListStreamOptions,
  emitter: IEmitter<T>,
): Promise<void> {
  try {
    const [prevStream, nextStream] = await Promise.all([
      getValidClientStream(prevList, ListType.PREV),
      getValidClientStream(nextList, ListType.NEXT),
    ]);

    getDiffChunks(prevStream, nextStream, referenceKey, emitter, options);
  } catch (err) {
    return emitter.emit(StreamEvent.Error, err as Error);
  }
}

/**
 * Streams the diff of two object lists
 * @param {ReadableStream | File | Record<string, unknown>[]} prevList - The original object list.
 * @param {ReadableStream | File | Record<string, unknown>[]} nextList - The new object list.
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
  prevList: ReadableStream<T> | File | T[],
  nextList: ReadableStream<T> | File | T[],
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
