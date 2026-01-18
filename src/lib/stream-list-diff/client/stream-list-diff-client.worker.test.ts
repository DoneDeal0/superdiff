/**
 * @jest-environment jsdom
 */
import "blob-polyfill";
import "jsdom";
import { ReadableStream } from "web-streams-polyfill";
import prevListFile from "@mocks/prevList.json";
import nextListFile from "@mocks/nextList.json";
import { ListStatus } from "@models/list";
import {
  ListStreamOptions,
  ReferenceKey,
  StreamEvent,
  StreamListDiff,
} from "@models/stream";
import { workerDiff } from "./worker/utils";
import { streamListDiff } from ".";

class Worker {
  onmessage: ((event: { data: unknown }) => void) | null = null;

  postMessage<T extends Record<string, unknown>>(msg: {
    prevList: File | T[];
    nextList: File | T[];
    referenceKey: ReferenceKey<T>;
    options: ListStreamOptions;
  }) {
    if (msg) {
      const { prevList, nextList, referenceKey, options } = msg;
      const listener = workerDiff(prevList, nextList, referenceKey, options);

      listener.on(StreamEvent.Data, (chunk) => {
        this.onmessage!({
          data: { event: StreamEvent.Data, chunk },
        });
      });

      listener.on(StreamEvent.Finish, () => {
        this.onmessage!({
          data: { event: StreamEvent.Finish },
        });
      });

      listener.on(StreamEvent.Error, (error) => {
        this.onmessage!({
          data: { event: StreamEvent.Error, error: error.message },
        });
      });
    }
  }

  terminate() {}
}

// @ts-expect-error - a Worker polyfill is necessary to test a Web Worker in a Node environment.
global.Worker = Worker;
// @ts-expect-error - the ReadableStream polyfill is necessary to test ReadableStream in a Node environment.
global.ReadableStream = ReadableStream;

describe("data emission", () => {
  it("emits 'data' event and consider the all the nextList added if no prevList is provided", (done) => {
    const nextList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const diff = streamListDiff([], nextList, "id", {
      chunksSize: 2,
      showWarnings: false,
    });

    const expectedChunks = [
      {
        value: { id: 1, name: "Item 1" },
        index: 0,
        previousValue: null,
        previousIndex: null,
        status: ListStatus.ADDED,
      },
      {
        value: { id: 2, name: "Item 2" },
        index: 1,
        previousValue: null,
        previousIndex: null,
        status: ListStatus.ADDED,
      },
    ];
    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
  it("emits 'data' event and consider the all the prevList deleted if no nextList is provided", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const diff = streamListDiff(prevList, [], "id", { chunksSize: 2 });

    const expectedChunks = [
      {
        value: null,
        index: null,
        previousValue: { id: 1, name: "Item 1" },
        previousIndex: 0,
        status: ListStatus.DELETED,
      },
      {
        value: null,
        index: null,
        previousValue: { id: 2, name: "Item 2" },
        previousIndex: 1,
        status: ListStatus.DELETED,
      },
    ];
    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error(err));
    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
  it("emits 'data' event with one object diff by chunk if chunkSize is 0 or undefined", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const nextList = [
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
    ];
    const diff = streamListDiff(prevList, nextList, "id");

    const expectedChunks = [
      [
        {
          value: { id: 2, name: "Item 2" },
          index: 0,
          previousValue: { id: 2, name: "Item 2" },
          previousIndex: 1,
          status: ListStatus.MOVED,
        },
      ],
      [
        {
          value: null,
          index: null,
          previousValue: { id: 1, name: "Item 1" },
          previousIndex: 0,
          status: ListStatus.DELETED,
        },
      ],
      [
        {
          value: { id: 3, name: "Item 3" },
          index: 1,
          previousValue: null,
          previousIndex: null,
          status: ListStatus.ADDED,
        },
      ],
    ];

    let chunkCount = 0;

    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks[chunkCount]);
      chunkCount++;
    });
    diff.on("finish", () => {
      expect(chunkCount).toBe(3);
      done();
    });
  });
  it("emits 'data' event with 5 object diff by chunk and return the last object diff in a one entry chunk at the end", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
      { id: 4, name: "Item 4" },
      { id: 5, name: "Item 5" },
      { id: 6, name: "Item 6" },
      { id: 7, name: "Item 7" },
      { id: 8, name: "Item 8" },
      { id: 9, name: "Item 9" },
      { id: 10, name: "Item 10" },
    ];
    const nextList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item Two" },
      { id: 3, name: "Item 3" },
      { id: 5, name: "Item 5" },
      { id: 6, name: "Item Six" },
      { id: 7, name: "Item 7" },
      { id: 10, name: "Item 10" },
      { id: 11, name: "Item 11" },
      { id: 9, name: "Item 9" },
      { id: 8, name: "Item 8" },
    ];
    const diff = streamListDiff(prevList, nextList, "id", { chunksSize: 5 });

    const expectedChunks = [
      [
        {
          value: { id: 1, name: "Item 1" },
          index: 0,
          previousValue: { id: 1, name: "Item 1" },
          previousIndex: 0,
          status: ListStatus.EQUAL,
        },
        {
          value: { id: 2, name: "Item Two" },
          index: 1,
          previousValue: { id: 2, name: "Item 2" },
          previousIndex: 1,
          status: ListStatus.UPDATED,
        },
        {
          value: { id: 3, name: "Item 3" },
          index: 2,
          previousValue: { id: 3, name: "Item 3" },
          previousIndex: 2,
          status: ListStatus.EQUAL,
        },
        {
          value: { id: 5, name: "Item 5" },
          index: 3,
          previousValue: { id: 5, name: "Item 5" },
          previousIndex: 4,
          status: ListStatus.MOVED,
        },
        {
          value: { id: 6, name: "Item Six" },
          index: 4,
          previousValue: { id: 6, name: "Item 6" },
          previousIndex: 5,
          status: ListStatus.UPDATED,
        },
      ],
      [
        {
          value: { id: 7, name: "Item 7" },
          index: 5,
          previousValue: { id: 7, name: "Item 7" },
          previousIndex: 6,
          status: ListStatus.MOVED,
        },
        {
          value: { id: 9, name: "Item 9" },
          index: 8,
          previousValue: { id: 9, name: "Item 9" },
          previousIndex: 8,
          status: ListStatus.EQUAL,
        },
        {
          value: { id: 10, name: "Item 10" },
          index: 6,
          previousValue: { id: 10, name: "Item 10" },
          previousIndex: 9,
          status: ListStatus.MOVED,
        },
        {
          value: { id: 8, name: "Item 8" },
          index: 9,
          previousValue: { id: 8, name: "Item 8" },
          previousIndex: 7,
          status: ListStatus.MOVED,
        },
        {
          value: null,
          index: null,
          previousValue: { id: 4, name: "Item 4" },
          previousIndex: 3,
          status: ListStatus.DELETED,
        },
      ],
      [
        {
          value: { id: 11, name: "Item 11" },
          index: 7,
          previousValue: null,
          previousIndex: null,
          status: ListStatus.ADDED,
        },
      ],
    ];

    let chunkCount = 0;

    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks[chunkCount]);
      chunkCount++;
    });

    diff.on("finish", () => {
      expect(chunkCount).toBe(3);
      done();
    });
  });
  it("emits 'data' event with all the objects diff in a single chunk if the chunkSize is bigger than the provided lists ", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
      { id: 4, name: "Item 4" },
    ];
    const nextList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item Two" },
      { id: 3, name: "Item 3" },
      { id: 5, name: "Item 5" },
    ];

    const diff = streamListDiff(prevList, nextList, "id", {
      chunksSize: 150,
    });

    const expectedChunks = [
      {
        value: { id: 1, name: "Item 1" },
        index: 0,
        previousValue: { id: 1, name: "Item 1" },
        previousIndex: 0,
        status: ListStatus.EQUAL,
      },
      {
        value: { id: 2, name: "Item Two" },
        index: 1,
        previousValue: { id: 2, name: "Item 2" },
        previousIndex: 1,
        status: ListStatus.UPDATED,
      },
      {
        value: { id: 3, name: "Item 3" },
        index: 2,
        previousValue: { id: 3, name: "Item 3" },
        previousIndex: 2,
        status: ListStatus.EQUAL,
      },
      {
        value: null,
        index: null,
        previousValue: { id: 4, name: "Item 4" },
        previousIndex: 3,
        status: ListStatus.DELETED,
      },
      {
        value: { id: 5, name: "Item 5" },
        index: 3,
        previousValue: null,
        previousIndex: null,
        status: ListStatus.ADDED,
      },
    ];

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });

    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
  it("emits 'data' event with moved objects considered as updated if considerMoveAsUpdate is true", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
      { id: 4, name: "Item 4" },
    ];
    const nextList = [
      { id: 2, name: "Item Two" },
      { id: 1, name: "Item 1" },
      { id: 3, name: "Item 3" },
      { id: 5, name: "Item 5" },
    ];
    const diff = streamListDiff(prevList, nextList, "id", {
      chunksSize: 5,
      considerMoveAsUpdate: true,
    });

    const expectedChunks = [
      {
        previousValue: { id: 2, name: "Item 2" },
        value: { id: 2, name: "Item Two" },
        previousIndex: 1,
        index: 0,
        status: ListStatus.UPDATED,
      },
      {
        value: { id: 1, name: "Item 1" },
        index: 1,
        previousValue: { id: 1, name: "Item 1" },
        previousIndex: 0,
        status: ListStatus.UPDATED,
      },
      {
        value: { id: 3, name: "Item 3" },
        index: 2,
        previousValue: { id: 3, name: "Item 3" },
        previousIndex: 2,
        status: ListStatus.EQUAL,
      },
      {
        value: null,
        index: null,
        previousValue: { id: 4, name: "Item 4" },
        previousIndex: 3,
        status: ListStatus.DELETED,
      },
      {
        value: { id: 5, name: "Item 5" },
        index: 3,
        previousValue: null,
        previousIndex: null,
        status: ListStatus.ADDED,
      },
    ];

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });

    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
  it("emits 'data' event only with objects diff whose status match with showOnly's", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
      { id: 4, name: "Item 4" },
    ];
    const nextList = [
      { id: 2, name: "Item Two" },
      { id: 1, name: "Item 1" },
      { id: 3, name: "Item 3" },
      { id: 5, name: "Item 5" },
    ];
    const diff = streamListDiff(prevList, nextList, "id", {
      chunksSize: 5,
      showOnly: ["added", "deleted"],
    });

    const expectedChunks = [
      {
        previousValue: { id: 4, name: "Item 4" },
        value: null,
        previousIndex: 3,
        index: null,

        status: ListStatus.DELETED,
      },
      {
        previousValue: null,
        value: { id: 5, name: "Item 5" },
        previousIndex: null,
        index: 3,

        status: ListStatus.ADDED,
      },
    ];

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });

    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
  it("emits 'data' event with deep nested objects diff", (done) => {
    const prevList = [
      {
        id: 1,
        name: "Item 1",
        user: { role: "admin", hobbies: ["golf", "football"] },
      },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3", user: { role: "admin", hobbies: ["rugby"] } },
      {
        id: 4,
        name: "Item 4",
        user: { role: "reader", hobbies: ["video games", "fishing"] },
      },
      { id: 5, name: "Item 5" },
      { id: 6, name: "Item 6", user: { role: "root", hobbies: ["coding"] } },
      { id: 7, name: "Item 7" },
      { id: 8, name: "Item 8" },
      { id: 9, name: "Item 9" },
      {
        id: 10,
        name: "Item 10",
        user: {
          role: "root",
          hobbies: ["coding"],
          skills: { driving: true, diving: false },
        },
      },
    ];
    const nextList = [
      {
        id: 1,
        name: "Item 1",
        user: { role: "admin", hobbies: ["golf", "football"] },
      },
      { id: 2, name: "Item Two" },
      { id: 3, name: "Item 3", user: { role: "admin", hobbies: ["rugby"] } },
      { id: 5, name: "Item 5" },
      { id: 6, name: "Item 6", user: { role: "root", hobbies: ["farming"] } },
      { id: 7, name: "Item 7" },
      {
        id: 10,
        name: "Item 10",
        user: {
          role: "root",
          hobbies: ["coding"],
          skills: { driving: true, diving: false },
        },
      },
      { id: 11, name: "Item 11" },
      { id: 9, name: "Item 9" },
      { id: 8, name: "Item 8" },
    ];
    const diff = streamListDiff(prevList, nextList, "id", {
      chunksSize: 5,
    });

    const expectedChunks = [
      [
        {
          value: {
            id: 1,
            name: "Item 1",
            user: { role: "admin", hobbies: ["golf", "football"] },
          },
          index: 0,
          previousValue: {
            id: 1,
            name: "Item 1",
            user: { role: "admin", hobbies: ["golf", "football"] },
          },
          previousIndex: 0,
          status: ListStatus.EQUAL,
        },
        {
          value: { id: 2, name: "Item Two" },
          index: 1,
          previousValue: { id: 2, name: "Item 2" },
          previousIndex: 1,
          status: ListStatus.UPDATED,
        },
        {
          value: {
            id: 3,
            name: "Item 3",
            user: { role: "admin", hobbies: ["rugby"] },
          },
          index: 2,
          previousValue: {
            id: 3,
            name: "Item 3",
            user: { role: "admin", hobbies: ["rugby"] },
          },
          previousIndex: 2,
          status: ListStatus.EQUAL,
        },
        {
          value: { id: 5, name: "Item 5" },
          index: 3,
          previousValue: { id: 5, name: "Item 5" },
          previousIndex: 4,
          status: ListStatus.MOVED,
        },
        {
          value: {
            id: 6,
            name: "Item 6",
            user: { role: "root", hobbies: ["farming"] },
          },
          index: 4,
          previousValue: {
            id: 6,
            name: "Item 6",
            user: { role: "root", hobbies: ["coding"] },
          },
          previousIndex: 5,
          status: ListStatus.UPDATED,
        },
      ],
      [
        {
          value: { id: 7, name: "Item 7" },
          index: 5,
          previousValue: { id: 7, name: "Item 7" },
          previousIndex: 6,
          status: ListStatus.MOVED,
        },
        {
          value: { id: 9, name: "Item 9" },
          index: 8,
          previousValue: { id: 9, name: "Item 9" },
          previousIndex: 8,
          status: ListStatus.EQUAL,
        },
        {
          value: {
            id: 10,
            name: "Item 10",
            user: {
              role: "root",
              hobbies: ["coding"],
              skills: { driving: true, diving: false },
            },
          },
          index: 6,
          previousValue: {
            id: 10,
            name: "Item 10",
            user: {
              role: "root",
              hobbies: ["coding"],
              skills: { driving: true, diving: false },
            },
          },
          previousIndex: 9,
          status: ListStatus.MOVED,
        },
        {
          value: { id: 8, name: "Item 8" },
          index: 9,
          previousValue: { id: 8, name: "Item 8" },
          previousIndex: 7,
          status: ListStatus.MOVED,
        },
        {
          value: null,
          index: null,
          previousValue: {
            id: 4,
            name: "Item 4",
            user: { role: "reader", hobbies: ["video games", "fishing"] },
          },
          previousIndex: 3,
          status: ListStatus.DELETED,
        },
      ],
      [
        {
          value: { id: 11, name: "Item 11" },
          index: 7,
          previousValue: null,
          previousIndex: null,
          status: ListStatus.ADDED,
        },
      ],
    ];

    let chunkCount = 0;

    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks[chunkCount]);
      chunkCount++;
    });

    diff.on("finish", () => {
      expect(chunkCount).toBe(3);
      done();
    });
  });
});

describe("input handling", () => {
  const prevList = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: 3, name: "Item 3" },
    { id: 4, name: "Item 4" },
  ];
  const nextList = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item Two" },
    { id: 3, name: "Item 3" },
    { id: 5, name: "Item 5" },
  ];
  const expectedChunks = [
    {
      value: { id: 1, name: "Item 1" },
      index: 0,
      previousValue: { id: 1, name: "Item 1" },
      previousIndex: 0,
      status: ListStatus.EQUAL,
    },
    {
      value: { id: 2, name: "Item Two" },
      index: 1,
      previousValue: { id: 2, name: "Item 2" },
      previousIndex: 1,
      status: ListStatus.UPDATED,
    },
    {
      value: { id: 3, name: "Item 3" },
      index: 2,
      previousValue: { id: 3, name: "Item 3" },
      previousIndex: 2,
      status: ListStatus.EQUAL,
    },
    {
      value: null,
      index: null,
      previousValue: { id: 4, name: "Item 4" },
      previousIndex: 3,
      status: ListStatus.DELETED,
    },
    {
      value: { id: 5, name: "Item 5" },
      index: 3,
      previousValue: null,
      previousIndex: null,
      status: ListStatus.ADDED,
    },
  ];

  it("handles two readable streams", (done) => {
    const prevStream = new ReadableStream({
      start(controller) {
        prevList.forEach((item) => controller.enqueue(item));
        controller.close();
      },
    });
    const nextStream = new ReadableStream({
      start(controller) {
        nextList.forEach((item) => controller.enqueue(item));
        controller.close();
      },
    });

    const diff = streamListDiff(prevStream, nextStream, "id", {
      chunksSize: 5,
      showWarnings: false,
    });

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error(err));
    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
  it("handles two local files", (done) => {
    const prevFile = new File([JSON.stringify(prevListFile)], "prevList.json", {
      type: "application/json",
    });

    const nextFile = new File([JSON.stringify(nextListFile)], "nextList.json", {
      type: "application/json",
    });

    const diff = streamListDiff(prevFile, nextFile, "id", {
      chunksSize: 5,
    });

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error(err));
    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
  it("handles a readable stream against a local file", (done) => {
    const prevStream = new ReadableStream({
      start(controller) {
        prevList.forEach((item) => controller.enqueue(item));
        controller.close();
      },
    });
    const nextFile = new File([JSON.stringify(nextListFile)], "nextList.json", {
      type: "application/json",
    });

    const diff = streamListDiff(prevStream, nextFile, "id", {
      chunksSize: 5,
      showWarnings: false,
    });

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error(err));
    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
  it("handles a readable stream against an array", (done) => {
    const prevStream = new ReadableStream({
      start(controller) {
        prevList.forEach((item) => controller.enqueue(item));
        controller.close();
      },
    });

    const diff = streamListDiff(prevStream, nextList, "id", {
      chunksSize: 5,
      showWarnings: false,
    });

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error(err));
    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
  it("handles a local file against an array", (done) => {
    const prevFile = new File([JSON.stringify(prevListFile)], "prevList.json", {
      type: "application/json",
    });

    const diff = streamListDiff(prevFile, nextList, "id", {
      chunksSize: 5,
    });

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error(err));
    diff.on("finish", () => {
      expect(chunkCount).toBe(1);
      done();
    });
  });
});

describe("finish event", () => {
  it("emits 'finish' event if no prevList nor nextList is provided", (done) => {
    const diff = streamListDiff([], [], "id");
    diff.on("finish", () => done());
  });
  it("emits 'finish' event when all the chunks have been processed", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const nextList = [
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
    ];
    const diff = streamListDiff(prevList, nextList, "id");
    diff.on("finish", () => done());
  });
});

describe("error event", () => {
  test("emits 'error' event when prevList has invalid data", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      "hello",
      { id: 2, name: "Item 2" },
    ];
    const nextList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];

    // @ts-expect-error prevList is invalid by design for the test
    const diff = streamListDiff(prevList, nextList, "id");

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        `Your prevList must only contain valid objects. Found 'hello'`,
      );
      done();
    });
  });

  test("emits 'error' event when nextList has invalid data", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const nextList = [
      { id: 1, name: "Item 1" },
      "hello",
      { id: 2, name: "Item 2" },
    ];

    // @ts-expect-error nextList is invalid by design for the test
    const diff = streamListDiff(prevList, nextList, "id");

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        `Your nextList must only contain valid objects. Found 'hello'`,
      );
      done();
    });
  });

  test("emits 'error' event when all prevList ojects don't have the requested referenceKey", (done) => {
    const prevList = [{ id: 1, name: "Item 1" }, { name: "Item 2" }];
    const nextList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];

    const diff = streamListDiff(prevList, nextList, "id");

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        `The referenceKey 'id' is not available in all the objects of your prevList.`,
      );
      done();
    });
  });

  test("emits 'error' event when all nextList ojects don't have the requested referenceKey", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const nextList = [{ id: 1, name: "Item 1" }, { name: "Item 2" }];

    const diff = streamListDiff(prevList, nextList, "id");

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        `The referenceKey 'id' is not available in all the objects of your nextList.`,
      );
      done();
    });
  });

  test("emits 'error' event when the chunkSize option is negative", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const nextList = [{ id: 1, name: "Item 1" }, { name: "Item 2" }];

    const diff = streamListDiff(prevList, nextList, "id", {
      chunksSize: -3,
    });

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        "The chunk size can't be negative. You entered the value '-3'",
      );
      done();
    });
  });

  test("emits 'error' event when the prevList is not a valid type", (done) => {
    const nextList = [{ id: 1, name: "Item 1" }, { name: "Item 2" }];

    // @ts-expect-error - prevList is invalid by design for the test
    const diff = streamListDiff({ name: "hello" }, nextList, "id");

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        "Invalid prevList. Expected ReadableStream, Array, or File.",
      );
      done();
    });
  });
  test("emits 'error' event when the nextList is not a valid type", (done) => {
    const prevList = [{ id: 1, name: "Item 1" }, { name: "Item 2" }];

    // @ts-expect-error - nextList is invalid by design for the test
    const diff = streamListDiff(prevList, null, "id");

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        "Invalid nextList. Expected ReadableStream, Array, or File.",
      );
      done();
    });
  });
});

const generateLargeDataset = (count: number) => {
  const data: Array<{ id: number; value: string }> = [];
  for (let i = 0; i < count; i++) {
    data.push({ id: i, value: `value-${i}` });
  }
  return data;
};

describe("performance", () => {
  it("process 100.000 in each stream", (done) => {
    const numEntries = 100_000;

    const prevList = generateLargeDataset(numEntries);
    const nextList = generateLargeDataset(numEntries);

    nextList[100].value = "updated-value-100"; // 1 updated entry
    nextList[20_000].value = "updated-value-20000"; // Another updated entry
    nextList.push({ id: numEntries, value: `new-value-${numEntries}` }); // 1 added entry

    const diffListener = streamListDiff<{ id: number; value: string }>(
      prevList,
      nextList,
      "id",
      {
        chunksSize: 10_000,
      },
    );

    const diffs: StreamListDiff<{ id: number; value: string }>[] = [];

    diffListener.on("data", (chunk) => {
      diffs.push(...chunk);
    });

    diffListener.on("finish", () => {
      try {
        const updatedEntries = diffs.filter((d) => d.status === "updated");
        const addedEntries = diffs.filter((d) => d.status === "added");
        const deletedEntries = diffs.filter((d) => d.status === "deleted");
        const equalEntries = diffs.filter((d) => d.status === "equal");

        expect(updatedEntries.length).toBe(2);
        expect(addedEntries.length).toBe(1);
        expect(deletedEntries.length).toBe(0);
        expect(equalEntries.length).toBe(99998);
        done();
      } catch (err) {
        done(err);
      }
    });

    diffListener.on("error", (err) => done(err));
  });
});
