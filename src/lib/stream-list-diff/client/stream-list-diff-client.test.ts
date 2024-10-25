/**
 * @jest-environment jsdom
 */
import "blob-polyfill";
import { ReadableStream } from "web-streams-polyfill";
import { LIST_STATUS } from "@models/list";
import { StreamListDiff } from "@models/stream";
import { streamListDiff } from ".";
import prevListFile from "../../../mocks/prevList.json";
import nextListFile from "../../../mocks/nextList.json";

//@ts-expect-error - the ReadableStream polyfill is necessary to test ReadableStream in a Node environment.
global.ReadableStream = ReadableStream;

describe("data emission", () => {
  it("emits 'data' event and consider the all the nextList added if no prevList is provided", (done) => {
    const nextList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const diff = streamListDiff([], nextList, "id", { chunksSize: 2 });

    const expectedChunks = [
      {
        previousValue: null,
        currentValue: { id: 1, name: "Item 1" },
        prevIndex: null,
        newIndex: 0,
        indexDiff: null,
        status: LIST_STATUS.ADDED,
      },
      {
        previousValue: null,
        currentValue: { id: 2, name: "Item 2" },
        prevIndex: null,
        newIndex: 1,
        indexDiff: null,
        status: LIST_STATUS.ADDED,
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
        previousValue: { id: 1, name: "Item 1" },
        currentValue: null,
        prevIndex: 0,
        newIndex: null,
        indexDiff: null,
        status: LIST_STATUS.DELETED,
      },
      {
        previousValue: { id: 2, name: "Item 2" },
        currentValue: null,
        prevIndex: 1,
        newIndex: null,
        indexDiff: null,
        status: LIST_STATUS.DELETED,
      },
    ];
    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error("shiiiite", err));
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
          previousValue: { id: 2, name: "Item 2" },
          currentValue: { id: 2, name: "Item 2" },
          prevIndex: 1,
          newIndex: 0,
          indexDiff: -1,
          status: LIST_STATUS.MOVED,
        },
      ],
      [
        {
          previousValue: { id: 1, name: "Item 1" },
          currentValue: null,
          prevIndex: 0,
          newIndex: null,
          indexDiff: null,
          status: LIST_STATUS.DELETED,
        },
      ],
      [
        {
          previousValue: null,
          currentValue: { id: 3, name: "Item 3" },
          prevIndex: null,
          newIndex: 1,
          indexDiff: null,
          status: LIST_STATUS.ADDED,
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
    const diff = streamListDiff(prevList, nextList, "id", {
      chunksSize: 5,
    });

    const expectedChunks = [
      [
        {
          previousValue: { id: 1, name: "Item 1" },
          currentValue: { id: 1, name: "Item 1" },
          prevIndex: 0,
          newIndex: 0,
          indexDiff: 0,
          status: LIST_STATUS.EQUAL,
        },
        {
          previousValue: { id: 2, name: "Item 2" },
          currentValue: { id: 2, name: "Item Two" },
          prevIndex: 1,
          newIndex: 1,
          indexDiff: 0,
          status: LIST_STATUS.UPDATED,
        },
        {
          previousValue: { id: 3, name: "Item 3" },
          currentValue: { id: 3, name: "Item 3" },
          prevIndex: 2,
          newIndex: 2,
          indexDiff: 0,
          status: LIST_STATUS.EQUAL,
        },
        {
          previousValue: { id: 5, name: "Item 5" },
          currentValue: { id: 5, name: "Item 5" },
          prevIndex: 4,
          newIndex: 3,
          indexDiff: -1,
          status: LIST_STATUS.MOVED,
        },
        {
          previousValue: { id: 6, name: "Item 6" },
          currentValue: { id: 6, name: "Item Six" },
          prevIndex: 5,
          newIndex: 4,
          indexDiff: -1,
          status: LIST_STATUS.UPDATED,
        },
      ],
      [
        {
          previousValue: { id: 7, name: "Item 7" },
          currentValue: { id: 7, name: "Item 7" },
          prevIndex: 6,
          newIndex: 5,
          indexDiff: -1,
          status: LIST_STATUS.MOVED,
        },
        {
          previousValue: { id: 9, name: "Item 9" },
          currentValue: { id: 9, name: "Item 9" },
          prevIndex: 8,
          newIndex: 8,
          indexDiff: 0,
          status: LIST_STATUS.EQUAL,
        },
        {
          previousValue: { id: 10, name: "Item 10" },
          currentValue: { id: 10, name: "Item 10" },
          prevIndex: 9,
          newIndex: 6,
          indexDiff: -3,
          status: LIST_STATUS.MOVED,
        },
        {
          previousValue: { id: 8, name: "Item 8" },
          currentValue: { id: 8, name: "Item 8" },
          prevIndex: 7,
          newIndex: 9,
          indexDiff: 2,
          status: LIST_STATUS.MOVED,
        },
        {
          previousValue: { id: 4, name: "Item 4" },
          currentValue: null,
          prevIndex: 3,
          newIndex: null,
          indexDiff: null,
          status: LIST_STATUS.DELETED,
        },
      ],
      [
        {
          previousValue: null,
          currentValue: { id: 11, name: "Item 11" },
          prevIndex: null,
          newIndex: 7,
          indexDiff: null,
          status: LIST_STATUS.ADDED,
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
        previousValue: { id: 1, name: "Item 1" },
        currentValue: { id: 1, name: "Item 1" },
        prevIndex: 0,
        newIndex: 0,
        indexDiff: 0,
        status: LIST_STATUS.EQUAL,
      },
      {
        previousValue: { id: 2, name: "Item 2" },
        currentValue: { id: 2, name: "Item Two" },
        prevIndex: 1,
        newIndex: 1,
        indexDiff: 0,
        status: LIST_STATUS.UPDATED,
      },
      {
        previousValue: { id: 3, name: "Item 3" },
        currentValue: { id: 3, name: "Item 3" },
        prevIndex: 2,
        newIndex: 2,
        indexDiff: 0,
        status: LIST_STATUS.EQUAL,
      },
      {
        previousValue: { id: 4, name: "Item 4" },
        currentValue: null,
        prevIndex: 3,
        newIndex: null,
        indexDiff: null,
        status: LIST_STATUS.DELETED,
      },
      {
        previousValue: null,
        currentValue: { id: 5, name: "Item 5" },
        prevIndex: null,
        newIndex: 3,
        indexDiff: null,
        status: LIST_STATUS.ADDED,
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
        currentValue: { id: 2, name: "Item Two" },
        prevIndex: 1,
        newIndex: 0,
        indexDiff: -1,
        status: LIST_STATUS.UPDATED,
      },
      {
        previousValue: { id: 1, name: "Item 1" },
        currentValue: { id: 1, name: "Item 1" },
        prevIndex: 0,
        newIndex: 1,
        indexDiff: 1,
        status: LIST_STATUS.UPDATED,
      },
      {
        previousValue: { id: 3, name: "Item 3" },
        currentValue: { id: 3, name: "Item 3" },
        prevIndex: 2,
        newIndex: 2,
        indexDiff: 0,
        status: LIST_STATUS.EQUAL,
      },
      {
        previousValue: { id: 4, name: "Item 4" },
        currentValue: null,
        prevIndex: 3,
        newIndex: null,
        indexDiff: null,
        status: LIST_STATUS.DELETED,
      },
      {
        previousValue: null,
        currentValue: { id: 5, name: "Item 5" },
        prevIndex: null,
        newIndex: 3,
        indexDiff: null,
        status: LIST_STATUS.ADDED,
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
        currentValue: null,
        prevIndex: 3,
        newIndex: null,
        indexDiff: null,
        status: LIST_STATUS.DELETED,
      },
      {
        previousValue: null,
        currentValue: { id: 5, name: "Item 5" },
        prevIndex: null,
        newIndex: 3,
        indexDiff: null,
        status: LIST_STATUS.ADDED,
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
          previousValue: {
            id: 1,
            name: "Item 1",
            user: { role: "admin", hobbies: ["golf", "football"] },
          },
          currentValue: {
            id: 1,
            name: "Item 1",
            user: { role: "admin", hobbies: ["golf", "football"] },
          },
          prevIndex: 0,
          newIndex: 0,
          indexDiff: 0,
          status: LIST_STATUS.EQUAL,
        },
        {
          previousValue: { id: 2, name: "Item 2" },
          currentValue: { id: 2, name: "Item Two" },
          prevIndex: 1,
          newIndex: 1,
          indexDiff: 0,
          status: LIST_STATUS.UPDATED,
        },
        {
          previousValue: {
            id: 3,
            name: "Item 3",
            user: { role: "admin", hobbies: ["rugby"] },
          },
          currentValue: {
            id: 3,
            name: "Item 3",
            user: { role: "admin", hobbies: ["rugby"] },
          },
          prevIndex: 2,
          newIndex: 2,
          indexDiff: 0,
          status: LIST_STATUS.EQUAL,
        },
        {
          previousValue: { id: 5, name: "Item 5" },
          currentValue: { id: 5, name: "Item 5" },
          prevIndex: 4,
          newIndex: 3,
          indexDiff: -1,
          status: LIST_STATUS.MOVED,
        },
        {
          previousValue: {
            id: 6,
            name: "Item 6",
            user: { role: "root", hobbies: ["coding"] },
          },
          currentValue: {
            id: 6,
            name: "Item 6",
            user: { role: "root", hobbies: ["farming"] },
          },
          prevIndex: 5,
          newIndex: 4,
          indexDiff: -1,
          status: LIST_STATUS.UPDATED,
        },
      ],
      [
        {
          previousValue: { id: 7, name: "Item 7" },
          currentValue: { id: 7, name: "Item 7" },
          prevIndex: 6,
          newIndex: 5,
          indexDiff: -1,
          status: LIST_STATUS.MOVED,
        },
        {
          previousValue: { id: 9, name: "Item 9" },
          currentValue: { id: 9, name: "Item 9" },
          prevIndex: 8,
          newIndex: 8,
          indexDiff: 0,
          status: LIST_STATUS.EQUAL,
        },
        {
          previousValue: {
            id: 10,
            name: "Item 10",
            user: {
              role: "root",
              hobbies: ["coding"],
              skills: { driving: true, diving: false },
            },
          },
          currentValue: {
            id: 10,
            name: "Item 10",
            user: {
              role: "root",
              hobbies: ["coding"],
              skills: { driving: true, diving: false },
            },
          },
          prevIndex: 9,
          newIndex: 6,
          indexDiff: -3,
          status: LIST_STATUS.MOVED,
        },
        {
          previousValue: { id: 8, name: "Item 8" },
          currentValue: { id: 8, name: "Item 8" },
          prevIndex: 7,
          newIndex: 9,
          indexDiff: 2,
          status: LIST_STATUS.MOVED,
        },
        {
          previousValue: {
            id: 4,
            name: "Item 4",
            user: { role: "reader", hobbies: ["video games", "fishing"] },
          },
          currentValue: null,
          prevIndex: 3,
          newIndex: null,
          indexDiff: null,
          status: LIST_STATUS.DELETED,
        },
      ],
      [
        {
          previousValue: null,
          currentValue: { id: 11, name: "Item 11" },
          prevIndex: null,
          newIndex: 7,
          indexDiff: null,
          status: LIST_STATUS.ADDED,
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
      previousValue: { id: 1, name: "Item 1" },
      currentValue: { id: 1, name: "Item 1" },
      prevIndex: 0,
      newIndex: 0,
      indexDiff: 0,
      status: LIST_STATUS.EQUAL,
    },
    {
      previousValue: { id: 2, name: "Item 2" },
      currentValue: { id: 2, name: "Item Two" },
      prevIndex: 1,
      newIndex: 1,
      indexDiff: 0,
      status: LIST_STATUS.UPDATED,
    },
    {
      previousValue: { id: 3, name: "Item 3" },
      currentValue: { id: 3, name: "Item 3" },
      prevIndex: 2,
      newIndex: 2,
      indexDiff: 0,
      status: LIST_STATUS.EQUAL,
    },
    {
      previousValue: { id: 4, name: "Item 4" },
      currentValue: null,
      prevIndex: 3,
      newIndex: null,
      indexDiff: null,
      status: LIST_STATUS.DELETED,
    },
    {
      previousValue: null,
      currentValue: { id: 5, name: "Item 5" },
      prevIndex: null,
      newIndex: 3,
      indexDiff: null,
      status: LIST_STATUS.ADDED,
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
    });

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error("sheeeet", err));
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
    diff.on("error", (err) => console.error("sheeeet", err));
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
    });

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error("sheeeet", err));
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
    });

    let chunkCount = 0;
    diff.on("data", (chunk) => {
      expect(chunk).toStrictEqual(expectedChunks);
      chunkCount++;
    });
    diff.on("error", (err) => console.error("sheeeet", err));
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
    diff.on("error", (err) => console.error("sheeeet", err));
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

  test("emits 'error' event when all prevList ojects don't have the requested reference property", (done) => {
    const prevList = [{ id: 1, name: "Item 1" }, { name: "Item 2" }];
    const nextList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];

    const diff = streamListDiff(prevList, nextList, "id");

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        `The reference property 'id' is not available in all the objects of your prevList.`,
      );
      done();
    });
  });

  test("emits 'error' event when all nextList ojects don't have the requested reference property", (done) => {
    const prevList = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const nextList = [{ id: 1, name: "Item 1" }, { name: "Item 2" }];

    const diff = streamListDiff(prevList, nextList, "id");

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        `The reference property 'id' is not available in all the objects of your nextList.`,
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
