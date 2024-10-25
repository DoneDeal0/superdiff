import { isObject } from "@lib/utils";
import {
  ListStreamOptions,
  ReferenceProperty,
  StreamListDiff,
} from "@models/stream";
import { Emitter, StreamEvent } from "./emitter";

export function isValidChunkSize(
  chunksSize: ListStreamOptions["chunksSize"],
): boolean {
  if (!chunksSize) return true;
  const sign = String(Math.sign(chunksSize));
  return sign !== "-1" && sign !== "NaN";
}

export function isDataValid<T extends Record<string, unknown>>(
  data: T,
  referenceProperty: ReferenceProperty<T>,
  listType: "prevList" | "nextList",
): { isValid: boolean; message?: string } {
  if (!isObject(data)) {
    return {
      isValid: false,
      message: `Your ${listType} must only contain valid objects. Found '${data}'`,
    };
  }
  if (!Object.hasOwn(data, referenceProperty)) {
    return {
      isValid: false,
      message: `The reference property '${String(referenceProperty)}' is not available in all the objects of your ${listType}.`,
    };
  }
  return {
    isValid: true,
    message: "",
  };
}

export function outputDiffChunk<T extends Record<string, unknown>>(
  emitter: Emitter<T>,
) {
  let chunks: StreamListDiff<T>[] = [];

  function handleDiffChunk(
    chunk: StreamListDiff<T>,
    options: ListStreamOptions,
  ): void {
    const showChunk = options?.showOnly
      ? options?.showOnly.includes(chunk.status)
      : true;
    if (!showChunk) {
      return;
    }
    if ((options.chunksSize as number) > 0) {
      chunks.push(chunk);
      if (chunks.length >= (options.chunksSize as number)) {
        const output = chunks;
        chunks = [];
        return emitter.emit(StreamEvent.Data, output);
      } else {
        return;
      }
    }
    return emitter.emit(StreamEvent.Data, [chunk]);
  }

  function releaseLastChunks() {
    if (chunks.length > 0) {
      const output = chunks;
      chunks = [];
      return emitter.emit(StreamEvent.Data, output);
    }
  }

  return {
    handleDiffChunk,
    releaseLastChunks,
  };
}
