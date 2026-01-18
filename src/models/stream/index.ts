import { EmitterEvents, Listener } from "@models/emitter";
import { ListStatus } from "@models/list";

export const READABLE_STREAM_ALERT = `Warning: using Readable streams may impact workers' performance since they need to be converted to arrays.
       Consider using arrays or files for optimal performance. Alternatively, you can turn the 'useWorker' option off.
       To disable this warning, set 'showWarnings' to false in production.`;

export const DEFAULT_LIST_STREAM_OPTIONS: ListStreamOptions = {
  chunksSize: 0,
  useWorker: true,
  showWarnings: true,
};

export enum StreamEvent {
  Data = "data",
  Finish = "finish",
  Error = "error",
}

export type StreamListDiff<T extends Record<string, unknown>> = {
  value: T | null;
  previousValue: T | null;
  index: number | null;
  previousIndex: number | null;
  status: `${ListStatus}`;
};

export type ReferenceKey<T extends Record<string, unknown>> = keyof T;

export type StreamReferences<T extends Record<string, unknown>> = Map<
  ReferenceKey<T>,
  { prevIndex: number; nextIndex?: number }
>;

export type DataBuffer<T extends Record<string, unknown>> = Map<
  ReferenceKey<T>,
  {
    data: T | null;
    index: number | null;
  }
>;

export type ListStreamOptions = {
  chunksSize?: number; // 0 by default.
  showOnly?: `${ListStatus}`[];
  considerMoveAsUpdate?: boolean;
  useWorker?: boolean; // true by default
  showWarnings?: boolean; // true by default
};

export type FilePath = string;

export interface StreamListener<T extends Record<string, unknown>> {
  on<E extends keyof EmitterEvents<T>>(
    event: E,
    listener: Listener<EmitterEvents<T>[E]>,
  ): this;
}
