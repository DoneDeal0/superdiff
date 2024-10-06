import { StreamListsDiff } from "@models/stream";

type Listener<T extends unknown[]> = (...args: T) => void;

export enum StreamEvent {
  Data = "data",
  Finish = "finish",
  Error = "error",
}

export type Emitter<T extends Record<string, unknown>> = EventEmitter<{
  data: [StreamListsDiff<T>[]];
  error: [Error];
  finish: [];
}>;

export class EventEmitter<Events extends Record<string, unknown[]>> {
  private events: Record<string, Listener<unknown[]>[]> = {};

  on<E extends keyof Events>(event: E, listener: Listener<Events[E]>): this {
    if (!this.events[event as string]) {
      this.events[event as string] = [];
    }
    this.events[event as string].push(listener as Listener<unknown[]>);
    return this;
  }

  emit<E extends keyof Events>(event: E, ...args: Events[E]): void {
    if (this.events[event as string]) {
      this.events[event as string].forEach((listener) => listener(...args));
    }
  }
}

export type EmitterEvents<T extends Record<string, unknown>> = {
  data: [StreamListsDiff<T>[]];
  error: [Error];
  finish: [];
};

export interface ReadOnlyEmitter<T extends Record<string, unknown>> {
  on<E extends keyof EmitterEvents<T>>(
    event: E,
    listener: Listener<EmitterEvents<T>[E]>,
  ): this;
}
