import { IEmitter, EmitterEvents, EventEmitter } from "@models/emitter";
import {
  ListStreamOptions,
  READABLE_STREAM_ALERT,
  ReferenceProperty,
  StreamEvent,
  StreamListener,
} from "@models/stream";
import { WebWorkerMessage } from "@models/worker";
import { generateStream } from "..";

export function workerDiff<T extends Record<string, unknown>>(
  prevList: File | T[],
  nextList: File | T[],
  referenceProperty: ReferenceProperty<T>,
  options: ListStreamOptions,
): StreamListener<T> {
  const emitter = new EventEmitter<EmitterEvents<T>>();
  setTimeout(
    () =>
      generateStream(prevList, nextList, referenceProperty, options, emitter),
    0,
  );
  return emitter as StreamListener<T>;
}

async function getArrayFromStream<T>(
  readableStream: ReadableStream<T>,
  showWarnings: boolean = true,
): Promise<T[]> {
  if (showWarnings) {
    console.warn(READABLE_STREAM_ALERT);
  }
  const reader = readableStream.getReader();
  const chunks: T[] = [];
  let result;
  while (!(result = await reader.read()).done) {
    chunks.push(result.value);
  }
  return chunks;
}

export async function generateWorker<T extends Record<string, unknown>>(
  prevList: ReadableStream<T> | File | T[],
  nextList: ReadableStream<T> | File | T[],
  referenceProperty: ReferenceProperty<T>,
  options: ListStreamOptions,
  emitter: IEmitter<T>,
) {
  try {
    if (prevList instanceof ReadableStream) {
      prevList = await getArrayFromStream(prevList, options?.showWarnings);
    }
    if (nextList instanceof ReadableStream) {
      nextList = await getArrayFromStream(nextList, options?.showWarnings);
    }
    const worker = new Worker(new URL("./web-worker.js", import.meta.url), {
      type: "module",
    });
    worker.postMessage({ prevList, nextList, referenceProperty, options });
    worker.onmessage = (e: WebWorkerMessage<T>) => {
      const { event, chunk, error } = e.data;
      if (event === StreamEvent.Data) {
        emitter.emit(StreamEvent.Data, chunk);
      } else if (event === StreamEvent.Finish) {
        emitter.emit(StreamEvent.Finish);
        worker.terminate();
      } else if (event === StreamEvent.Error) {
        emitter.emit(StreamEvent.Error, new Error(error));
        worker.terminate();
      }
    };
    worker.onerror = (err: ErrorEvent) =>
      emitter.emit(StreamEvent.Error, new Error(err.message));
  } catch (err) {
    return emitter.emit(StreamEvent.Error, err as Error);
  }
}
