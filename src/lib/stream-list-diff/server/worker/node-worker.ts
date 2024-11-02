import { parentPort } from "worker_threads";
import {
  FilePath,
  ListStreamOptions,
  ReferenceProperty,
  StreamEvent,
} from "@models/stream";
import { WorkerEvent } from "@models/worker";
import { workerDiff } from "./utils";

parentPort?.on(
  WorkerEvent.Message,
  async <T extends Record<string, unknown>>(event: {
    prevList: FilePath | T[];
    nextList: FilePath | T[];
    referenceProperty: ReferenceProperty<T>;
    options: ListStreamOptions;
  }) => {
    const { prevList, nextList, referenceProperty, options } = event;

    const listener = workerDiff(prevList, nextList, referenceProperty, options);

    listener.on(StreamEvent.Data, (chunk) => {
      parentPort?.postMessage({ event: StreamEvent.Data, chunk });
    });

    listener.on(StreamEvent.Finish, () => {
      parentPort?.postMessage({ event: StreamEvent.Finish });
    });

    listener.on(StreamEvent.Error, (error) => {
      parentPort?.postMessage({
        event: StreamEvent.Error,
        error: error.message,
      });
    });
  },
);
