import { isClient } from "@lib/utils";
import {
  DataBuffer,
  DEFAULT_LIST_STREAM_OPTIONS,
  ListStreamOptions,
  ReferenceProperty,
} from "@models/stream";
import { LIST_STATUS } from "@models/list";
import {
  Emitter,
  EmitterEvents,
  EventEmitter,
  StreamListener,
  StreamEvent,
} from "../emitter";
import { isDataValid, isValidChunkSize, outputDiffChunk } from "../utils";

async function getDiffChunks<T extends Record<string, unknown>>(
  prevStream: ReadableStream<T>,
  nextStream: ReadableStream<T>,
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

async function getValidClientStream<T extends Record<string, unknown>>(
  input: ReadableStream<T> | T[] | File,
  listType: "prevList" | "nextList",
): Promise<ReadableStream<T>> {
  if (Array.isArray(input)) {
    return new ReadableStream({
      start(controller) {
        input.forEach((item) => controller.enqueue(item));
        controller.close();
      },
    });
  }

  if (input instanceof ReadableStream) {
    return input;
  }

  if (input instanceof File) {
    const fileText = await input.text();
    let jsonData: T[];
    try {
      jsonData = JSON.parse(fileText);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_: unknown) {
      throw new Error(`Your ${listType} is not a valid JSON array.`);
    }

    if (!Array.isArray(jsonData)) {
      throw new Error(`Your ${listType} is not a JSON array.`);
    }
    return new ReadableStream({
      start(controller) {
        jsonData.forEach((item) => controller.enqueue(item));
        controller.close();
      },
    });
  }

  throw new Error(
    `Invalid ${listType}. Expected ReadableStream, Array, or File.`,
  );
}

/**
 * Streams the diff of two object lists
 * @param {Record<string, unknown>[]} prevList - The original object list.
 * @param {Record<string, unknown>[]} nextList - The new object list.
 * @param {ReferenceProperty<T>} referenceProperty - A common property in all the objects of your lists (e.g. `id`)
 * @param {ListStreamOptions} options - Options to refine your output.
    - `chunksSize`: the number of object diffs returned by each streamed chunk. (e.g. `0` = 1 object diff by chunk, `10` = 10 object diffs by chunk).
    - `showOnly`: returns only the values whose status you are interested in. (e.g. `["added", "equal"]`)
    - `considerMoveAsUpdate`: if set to `true` a `moved` object will be considered as `updated`
 * @returns EventEmitter
 */
export function streamListDiffClient<T extends Record<string, unknown>>(
  prevList: ReadableStream<T> | File | T[],
  nextList: ReadableStream<T> | File | T[],
  referenceProperty: ReferenceProperty<T>,
  options: ListStreamOptions = DEFAULT_LIST_STREAM_OPTIONS,
): StreamListener<T> {
  if (!isClient()) {
    throw new Error(
      "streamListDiffClient can only be used in a browser environment. Please use streamListDiff instead.",
    );
  }
  const emitter = new EventEmitter<EmitterEvents<T>>();
  setTimeout(async () => {
    try {
      const [prevStream, nextStream] = await Promise.all([
        getValidClientStream(prevList, "prevList"),
        getValidClientStream(nextList, "nextList"),
      ]);

      getDiffChunks(
        prevStream,
        nextStream,
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
