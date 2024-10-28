import { StreamListDiff } from "@models/stream";

export type Listener<T extends unknown[]> = (...args: T) => void;

export type EmitterEvents<T extends Record<string, unknown>> = {
  data: [StreamListDiff<T>[]];
  error: [Error];
  finish: [];
};

export type IEmitter<T extends Record<string, unknown>> = EventEmitter<{
  data: [StreamListDiff<T>[]];
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
