import { LIST_STATUS } from "@models/list";
import { streamListDiff } from ".";
import { StreamListDiff } from "@models/stream";

describe("streamListDiff data", () => {
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
          previousValue: null,
          currentValue: { id: 3, name: "Item 3" },
          prevIndex: null,
          newIndex: 1,
          indexDiff: null,
          status: LIST_STATUS.ADDED,
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
          previousValue: { id: 2, name: "Item 2" },
          currentValue: { id: 2, name: "Item 2" },
          prevIndex: 1,
          newIndex: 0,
          indexDiff: -1,
          status: LIST_STATUS.MOVED,
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
          previousValue: null,
          currentValue: { id: 11, name: "Item 11" },
          prevIndex: null,
          newIndex: 7,
          indexDiff: null,
          status: LIST_STATUS.ADDED,
        },
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
      ],
      [
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
        {
          previousValue: { id: 7, name: "Item 7" },
          currentValue: { id: 7, name: "Item 7" },
          prevIndex: 6,
          newIndex: 5,
          indexDiff: -1,
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
          previousValue: { id: 9, name: "Item 9" },
          currentValue: { id: 9, name: "Item 9" },
          prevIndex: 8,
          newIndex: 8,
          indexDiff: 0,
          status: LIST_STATUS.EQUAL,
        },
      ],
      [
        {
          previousValue: { id: 10, name: "Item 10" },
          currentValue: { id: 10, name: "Item 10" },
          prevIndex: 9,
          newIndex: 6,
          indexDiff: -3,
          status: LIST_STATUS.MOVED,
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
    const diff = streamListDiff(prevList, nextList, "id", { chunksSize: 150 });

    const expectedChunks = [
      {
        previousValue: null,
        currentValue: { id: 5, name: "Item 5" },
        prevIndex: null,
        newIndex: 3,
        indexDiff: null,
        status: LIST_STATUS.ADDED,
      },
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
        previousValue: null,
        currentValue: { id: 5, name: "Item 5" },
        prevIndex: null,
        newIndex: 3,
        indexDiff: null,
        status: LIST_STATUS.ADDED,
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
        previousValue: { id: 2, name: "Item 2" },
        currentValue: { id: 2, name: "Item Two" },
        prevIndex: 1,
        newIndex: 0,
        indexDiff: -1,
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
        previousValue: null,
        currentValue: { id: 5, name: "Item 5" },
        prevIndex: null,
        newIndex: 3,
        indexDiff: null,
        status: LIST_STATUS.ADDED,
      },
      {
        previousValue: { id: 4, name: "Item 4" },
        currentValue: null,
        prevIndex: 3,
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
    const diff = streamListDiff(prevList, nextList, "id", { chunksSize: 5 });

    const expectedChunks = [
      [
        {
          previousValue: null,
          currentValue: { id: 11, name: "Item 11" },
          prevIndex: null,
          newIndex: 7,
          indexDiff: null,
          status: LIST_STATUS.ADDED,
        },
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
        {
          previousValue: { id: 7, name: "Item 7" },
          currentValue: { id: 7, name: "Item 7" },
          prevIndex: 6,
          newIndex: 5,
          indexDiff: -1,
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
          previousValue: { id: 9, name: "Item 9" },
          currentValue: { id: 9, name: "Item 9" },
          prevIndex: 8,
          newIndex: 8,
          indexDiff: 0,
          status: LIST_STATUS.EQUAL,
        },
      ],
      [
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

describe("streamListDiff finish", () => {
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

describe("streamListDiff error", () => {
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

    const diff = streamListDiff(prevList, nextList, "id", { chunksSize: -3 });

    diff.on("error", (err) => {
      expect(err["message"]).toEqual(
        "The chunk size can't be negative. You entered the value '-3'",
      );
      done();
    });
  });
});

describe("Performance", () => {
  it("should correctly stream diff for 10.000 entries", (done) => {
    const generateLargeList = (size: number, idPrefix: string) => {
      return Array.from({ length: size }, (_, i) => ({
        id: `${idPrefix}-${i}`,
        value: i,
      }));
    };
    const prevList = generateLargeList(10_000, "prev");
    const nextList = [
      ...generateLargeList(5000, "prev"),
      ...generateLargeList(5000, "next"),
    ];

    const receivedChunks: StreamListDiff<{ id: string; value: number }>[] = [];
    let chunkCount = 0;
    const diffStream = streamListDiff(prevList, nextList, "id", {
      chunksSize: 1000,
    });

    diffStream.on("data", (chunk) => {
      receivedChunks.push(...chunk);
      chunkCount++;
    });

    diffStream.on("finish", () => {
      const deletions = receivedChunks.filter(
        (diff) => diff.status === LIST_STATUS.DELETED,
      );
      const additions = receivedChunks.filter(
        (diff) => diff.status === LIST_STATUS.ADDED,
      );
      const updates = receivedChunks.filter(
        (diff) => diff.status === LIST_STATUS.EQUAL,
      );
      expect(receivedChunks.length).toBe(15_000); // 5000 deletions + 5000 equal + 5000 additions
      expect(chunkCount).toBe(15);
      expect(deletions.length).toBe(5000);
      expect(additions.length).toBe(5000);
      expect(updates.length).toBe(5000);
      done();
    });
  });
  it("should correctly stream diff for 100.000 entries", (done) => {
    const generateLargeList = (size: number, idPrefix: string) => {
      return Array.from({ length: size }, (_, i) => ({
        id: `${idPrefix}-${i}`,
        value: i,
      }));
    };
    const prevList = generateLargeList(100_000, "prev");
    const nextList = [
      ...generateLargeList(50000, "prev"),
      ...generateLargeList(50000, "next"),
    ];

    const receivedChunks: StreamListDiff<{ id: string; value: number }>[] = [];
    let chunkCount = 0;
    const diffStream = streamListDiff(prevList, nextList, "id", {
      chunksSize: 10_000,
    });

    diffStream.on("data", (chunk) => {
      receivedChunks.push(...chunk);
      chunkCount++;
    });

    diffStream.on("finish", () => {
      const deletions = receivedChunks.filter(
        (diff) => diff.status === LIST_STATUS.DELETED,
      );
      const additions = receivedChunks.filter(
        (diff) => diff.status === LIST_STATUS.ADDED,
      );
      const updates = receivedChunks.filter(
        (diff) => diff.status === LIST_STATUS.EQUAL,
      );
      expect(receivedChunks.length).toBe(150_000); // 50.000 deletions + 50.000 equal + 50.000 additions
      expect(chunkCount).toBe(15);
      expect(deletions.length).toBe(50000);
      expect(additions.length).toBe(50000);
      expect(updates.length).toBe(50000);
      done();
    });
  });
});
