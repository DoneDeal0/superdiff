import { isObject } from "@lib/utils";
import { IEmitter } from "@models/emitter";
import { ListType } from "@models/list";
import {
  ListStreamOptions,
  ReferenceKey,
  StreamEvent,
  StreamListDiff,
} from "@models/stream";

export function isValidChunkSize(
  chunksSize: ListStreamOptions["chunksSize"],
): boolean {
  if (!chunksSize) return true;
  const sign = String(Math.sign(chunksSize));
  return sign !== "-1" && sign !== "NaN";
}

export function isDataValid<T extends Record<string, unknown>>(
  data: T,
  referenceKey: ReferenceKey<T>,
  listType: ListType,
): { isValid: boolean; message?: string } {
  if (!isObject(data)) {
    return {
      isValid: false,
      message: `Your ${listType} must only contain valid objects. Found '${data}'`,
    };
  }
  if (!Object.hasOwn(data, referenceKey)) {
    return {
      isValid: false,
      message: `The referenceKey '${String(referenceKey)}' is not available in all the objects of your ${listType}.`,
    };
  }
  return {
    isValid: true,
    message: "",
  };
}

export function outputDiffChunk<T extends Record<string, unknown>>(
  emitter: IEmitter<T>,
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
