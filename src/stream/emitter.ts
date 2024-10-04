type Listener<T extends unknown[]> = (...args: T) => void;

export enum StreamEvent {
  Data = "data",
  Finish = "finish",
  Error = "error",
}
export class EventEmitter {
  private events: Record<string, Listener<unknown[]>[]> = {};

  on<T extends unknown[]>(
    event: `${StreamEvent}`,
    listener: Listener<T>,
  ): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener as Listener<unknown[]>);
    return this;
  }

  emit<T extends unknown[]>(event: `${StreamEvent}`, ...args: T): void {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
    }
  }
}
