import { StreamEvent, StreamListDiff } from "@models/stream";

export enum WorkerEvent {
  Message = "message",
  Error = "error",
}

type WorkerData<T extends Record<string, unknown>> = {
  chunk: StreamListDiff<T>[];
  error: string;
  event: StreamEvent;
};

type WorkerMessage<T extends Record<string, unknown>> = {
  data: WorkerData<T>;
};

export type WebWorkerMessage<T extends Record<string, unknown>> =
  WorkerMessage<T>;

export type NodeWorkerMessage<T extends Record<string, unknown>> =
  WorkerData<T>;
