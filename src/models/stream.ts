import { LIST_STATUS } from "./list";

export type StreamListsDiff<T extends Record<string, unknown>> = {
  currentValue: T | null;
  previousValue: T | null;
  prevIndex: number | null;
  newIndex: number | null;
  indexDiff: number | null;
  status: LIST_STATUS;
};

export type ReferenceProperty<T extends Record<string, unknown>> = keyof T;

export type StreamReferences<T extends Record<string, unknown>> = Map<
  ReferenceProperty<T>,
  { prevIndex: number; nextIndex?: number }
>;

export type ListStreamOptions = {
  chunksSize?: number; // 0 by default. If 0, stream will be live
  showOnly?: `${LIST_STATUS}`[];
  considerMoveAsUpdate?: boolean;
};

export const DEFAULT_LIST_STREAM_OPTIONS: ListStreamOptions = {
  chunksSize: 0,
};
