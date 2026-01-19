import { ListStreamOptions, ReferenceKey, StreamEvent } from "@models/stream";
import { workerDiff } from "./utils";

self.onmessage = async <T extends Record<string, unknown>>(
  event: MessageEvent<{
    prevList: File | T[];
    nextList: File | T[];
    referenceKey: ReferenceKey<T>;
    options: ListStreamOptions;
  }>,
) => {
  const { prevList, nextList, referenceKey, options } = event.data;
  const listener = workerDiff(prevList, nextList, referenceKey, options);

  listener.on(StreamEvent.Data, (chunk) => {
    self.postMessage({ event: StreamEvent.Data, chunk });
  });

  listener.on(StreamEvent.Finish, () => {
    self.postMessage({ event: StreamEvent.Finish });
  });

  listener.on(StreamEvent.Error, (error) => {
    self.postMessage({ event: StreamEvent.Error, error: error.message });
  });
};
