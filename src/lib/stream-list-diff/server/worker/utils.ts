import path from "path";
import { once, Readable } from "stream";
import { Worker } from "worker_threads";
import { IEmitter, EmitterEvents, EventEmitter } from "@models/emitter";
import {
  FilePath,
  ListStreamOptions,
  READABLE_STREAM_ALERT,
  ReferenceProperty,
  StreamEvent,
  StreamListener,
} from "@models/stream";
import { NodeWorkerMessage, WorkerEvent } from "@models/worker";
import { generateStream } from "..";

async function getArrayFromStream<T>(
  stream: Readable,
  showWarnings: boolean = true,
): Promise<T[]> {
  if (showWarnings) {
    console.warn(READABLE_STREAM_ALERT);
  }
  const data: T[] = [];
  stream.on(StreamEvent.Data, (chunk) => data.push(chunk));
  await once(stream, "end");
  return data;
}

export async function generateWorker<T extends Record<string, unknown>>(
  prevList: Readable | FilePath | T[],
  nextList: Readable | FilePath | T[],
  referenceProperty: ReferenceProperty<T>,
  options: ListStreamOptions,
  emitter: IEmitter<T>,
) {
  try {
    if (prevList instanceof Readable) {
      prevList = await getArrayFromStream(prevList, options?.showWarnings);
    }
    if (nextList instanceof Readable) {
      nextList = await getArrayFromStream(nextList, options?.showWarnings);
    }
    const worker = new Worker(path.resolve(__dirname, "./node-worker.cjs"));
    worker.postMessage({ prevList, nextList, referenceProperty, options });
    worker.on(WorkerEvent.Message, (e: NodeWorkerMessage<T>) => {
      const { event, chunk, error } = e;
      if (event === StreamEvent.Data) {
        emitter.emit(StreamEvent.Data, chunk);
      } else if (event === StreamEvent.Finish) {
        emitter.emit(StreamEvent.Finish);
        worker.terminate();
      } else if (event === StreamEvent.Error) {
        emitter.emit(StreamEvent.Error, new Error(error));
        worker.terminate();
      }
    });
    worker.on(WorkerEvent.Error, (err) =>
      emitter.emit(StreamEvent.Error, new Error(err.message)),
    );
  } catch (err) {
    return emitter.emit(StreamEvent.Error, err as Error);
  }
}

export function workerDiff<T extends Record<string, unknown>>(
  prevList: FilePath | T[],
  nextList: FilePath | T[],
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
