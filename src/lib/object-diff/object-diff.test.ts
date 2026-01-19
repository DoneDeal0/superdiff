import { Granularity, ObjectStatus } from "@models/object";
import { getObjectDiff } from ".";

describe("getObjectDiff", () => {
  it("returns an empty diff if no objects are provided", () => {
    expect(getObjectDiff(null, null)).toStrictEqual({
      type: "object",
      status: "equal",
      diff: [],
    });
  });
  it("consider previous object as completely deleted if no next object is provided", () => {
    expect(
      getObjectDiff(
        { name: "joe", age: 54, hobbies: ["golf", "football"] },
        null,
      ),
    ).toStrictEqual({
      type: "object",
      status: "deleted",
      diff: [
        {
          key: "name",
          value: undefined,
          previousValue: "joe",
          status: "deleted",
        },
        {
          key: "age",
          value: undefined,
          previousValue: 54,
          status: "deleted",
        },
        {
          key: "hobbies",
          value: undefined,
          previousValue: ["golf", "football"],
          status: "deleted",
        },
      ],
    });
  });
  it("consider previous object as completely deleted if no next object is provided, and return an empty diff if showOnly doesn't require deleted values", () => {
    expect(
      getObjectDiff(
        {
          name: "joe",
          age: 54,
          hobbies: ["golf", "football"],
        },
        null,
        {
          showOnly: {
            statuses: [ObjectStatus.ADDED],
            granularity: Granularity.DEEP,
          },
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "deleted",
      diff: [],
    });
  });
  it("consider next object as completely added if no previous object is provided", () => {
    expect(
      getObjectDiff(null, {
        name: "joe",
        age: 54,
        hobbies: ["golf", "football"],
      }),
    ).toStrictEqual({
      type: "object",
      status: "added",
      diff: [
        {
          key: "name",
          value: "joe",
          previousValue: undefined,
          status: "added",
        },
        {
          key: "age",
          value: 54,
          previousValue: undefined,
          status: "added",
        },
        {
          key: "hobbies",
          value: ["golf", "football"],
          previousValue: undefined,
          status: "added",
        },
      ],
    });
  });
  it("consider objects as equal if no changes are detected", () => {
    expect(
      getObjectDiff(
        {
          age: 66,
          member: false,
          promoCode: null,
          city: undefined,
          hobbies: ["golf", "football"],
          options: { vegan: undefined, phone: null },
        },
        {
          age: 66,
          member: false,
          promoCode: null,
          city: undefined,
          hobbies: ["golf", "football"],
          options: { vegan: undefined, phone: null },
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "equal",
      diff: [
        {
          key: "age",
          value: 66,
          previousValue: 66,
          status: "equal",
        },
        {
          key: "member",
          value: false,
          previousValue: false,
          status: "equal",
        },
        {
          key: "promoCode",
          value: null,
          previousValue: null,
          status: "equal",
        },
        {
          key: "city",
          value: undefined,
          previousValue: undefined,
          status: "equal",
        },
        {
          key: "hobbies",
          value: ["golf", "football"],
          previousValue: ["golf", "football"],
          status: "equal",
        },
        {
          key: "options",
          value: { vegan: undefined, phone: null },
          previousValue: { vegan: undefined, phone: null },
          status: "equal",
        },
      ],
    });
  });
  it("detects changed between two objects", () => {
    expect(
      getObjectDiff(
        {
          id: 54,
          type: "sport",
          user: {
            name: "joe",
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
        },
        {
          id: 54,
          country: "us",
          user: {
            name: "joe",
            member: false,
            hobbies: ["golf", "chess"],
            nickname: "super joe",
          },
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          key: "id",
          value: 54,
          previousValue: 54,
          status: "equal",
        },
        {
          key: "type",
          value: undefined,
          previousValue: "sport",
          status: "deleted",
        },
        {
          key: "user",
          value: {
            name: "joe",
            member: false,
            hobbies: ["golf", "chess"],
            nickname: "super joe",
          },
          previousValue: {
            name: "joe",
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
          status: "updated",
          diff: [
            {
              key: "name",
              value: "joe",
              previousValue: "joe",
              status: "equal",
            },
            {
              key: "member",
              value: false,
              previousValue: true,
              status: "updated",
            },
            {
              key: "hobbies",
              value: ["golf", "chess"],
              previousValue: ["golf", "football"],
              status: "updated",
            },
            {
              key: "age",
              value: undefined,
              previousValue: 66,
              status: "deleted",
            },
            {
              key: "nickname",
              value: "super joe",
              previousValue: undefined,
              status: "added",
            },
          ],
        },
        {
          key: "country",
          value: "us",
          previousValue: undefined,
          status: "added",
        },
      ],
    });
  });
  it("detects changed between two deep nested objects", () => {
    expect(
      getObjectDiff(
        {
          id: 54,
          user: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg"],
                rugby: ["france"],
              },
            },
          },
        },
        {
          id: 54,
          user: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg", "nantes"],
                golf: ["st andrews"],
              },
            },
          },
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          key: "id",
          value: 54,
          previousValue: 54,
          status: "equal",
        },
        {
          key: "user",
          value: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg", "nantes"],
                golf: ["st andrews"],
              },
            },
          },
          previousValue: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg"],
                rugby: ["france"],
              },
            },
          },
          status: "updated",
          diff: [
            {
              key: "name",
              previousValue: "joe",
              value: "joe",
              status: "equal",
            },
            {
              key: "data",
              value: {
                member: true,
                hobbies: {
                  football: ["psg", "nantes"],
                  golf: ["st andrews"],
                },
              },
              previousValue: {
                member: true,
                hobbies: {
                  football: ["psg"],
                  rugby: ["france"],
                },
              },
              status: "updated",
              diff: [
                {
                  key: "member",
                  value: true,
                  previousValue: true,
                  status: "equal",
                },
                {
                  key: "hobbies",
                  value: {
                    football: ["psg", "nantes"],
                    golf: ["st andrews"],
                  },
                  previousValue: {
                    football: ["psg"],
                    rugby: ["france"],
                  },
                  status: "updated",
                  diff: [
                    {
                      key: "football",
                      value: ["psg", "nantes"],
                      previousValue: ["psg"],
                      status: "updated",
                    },
                    {
                      key: "rugby",
                      value: undefined,
                      previousValue: ["france"],
                      status: "deleted",
                    },
                    {
                      key: "golf",
                      value: ["st andrews"],
                      previousValue: undefined,
                      status: "added",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
  it("detects changed between two objects BUT doesn't care about array order as long as all values are preserved when ignoreArrayOrder option is activated", () => {
    expect(
      getObjectDiff(
        {
          id: 54,
          type: "sport",
          user: {
            name: "joe",
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
        },
        {
          id: 54,
          country: "us",
          user: {
            name: "joe",
            member: false,
            hobbies: ["football", "golf"],
            nickname: "super joe",
          },
        },
        { ignoreArrayOrder: true },
      ),
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          key: "id",
          value: 54,
          previousValue: 54,
          status: "equal",
        },
        {
          key: "type",
          value: undefined,
          previousValue: "sport",
          status: "deleted",
        },

        {
          key: "user",
          value: {
            name: "joe",
            member: false,
            hobbies: ["football", "golf"],
            nickname: "super joe",
          },
          previousValue: {
            name: "joe",
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
          status: "updated",
          diff: [
            {
              key: "name",
              value: "joe",
              previousValue: "joe",
              status: "equal",
            },
            {
              key: "member",
              value: false,
              previousValue: true,
              status: "updated",
            },
            {
              key: "hobbies",
              value: ["football", "golf"],
              previousValue: ["golf", "football"],
              status: "equal",
            },
            {
              key: "age",
              value: undefined,
              previousValue: 66,
              status: "deleted",
            },
            {
              key: "nickname",
              value: "super joe",
              previousValue: undefined,
              status: "added",
            },
          ],
        },
        {
          key: "country",
          value: "us",
          previousValue: undefined,
          status: "added",
        },
      ],
    });
  });
  it("shows only main added values", () => {
    expect(
      getObjectDiff(
        {
          id: 54,
          type: "sport",
          user: {
            name: "joe",
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
        },
        {
          id: 54,
          country: "us",
          user: {
            name: "joe",
            member: false,
            hobbies: ["golf", "chess"],
            nickname: "super joe",
          },
        },
        { showOnly: { statuses: [ObjectStatus.ADDED] } },
      ),
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          key: "country",
          value: "us",
          previousValue: undefined,
          status: "added",
        },
      ],
    });
  });
  it("shows only added and deleted values in nested objects", () => {
    expect(
      getObjectDiff(
        {
          id: 54,
          type: "sport",
          user: {
            name: "joe",
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
        },
        {
          id: 54,
          country: "us",
          user: {
            name: "joe",
            member: false,
            hobbies: ["golf", "chess"],
            nickname: "super joe",
          },
        },
        {
          showOnly: {
            statuses: [ObjectStatus.ADDED, ObjectStatus.DELETED],
            granularity: Granularity.DEEP,
          },
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          key: "type",
          value: undefined,
          previousValue: "sport",
          status: "deleted",
        },
        {
          key: "user",
          value: {
            name: "joe",
            member: false,
            hobbies: ["golf", "chess"],
            nickname: "super joe",
          },
          previousValue: {
            name: "joe",
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
          status: "updated",
          diff: [
            {
              key: "age",
              value: undefined,
              previousValue: 66,
              status: "deleted",
            },
            {
              key: "nickname",
              value: "super joe",
              previousValue: undefined,
              status: "added",
            },
          ],
        },
        {
          key: "country",
          value: "us",
          previousValue: undefined,
          status: "added",
        },
      ],
    });
  });
  it("shows only updated values in deeply nested objects", () => {
    expect(
      getObjectDiff(
        {
          id: 54,
          user: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg"],
                rugby: ["france"],
              },
            },
          },
        },
        {
          id: 54,
          user: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg", "nantes"],
                golf: ["st andrews"],
              },
            },
          },
        },
        {
          showOnly: {
            statuses: [ObjectStatus.UPDATED],
            granularity: Granularity.DEEP,
          },
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          key: "user",
          value: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg", "nantes"],
                golf: ["st andrews"],
              },
            },
          },
          previousValue: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg"],
                rugby: ["france"],
              },
            },
          },
          status: "updated",
          diff: [
            {
              key: "data",
              value: {
                member: true,
                hobbies: {
                  football: ["psg", "nantes"],
                  golf: ["st andrews"],
                },
              },
              previousValue: {
                member: true,
                hobbies: {
                  football: ["psg"],
                  rugby: ["france"],
                },
              },
              status: "updated",
              diff: [
                {
                  key: "hobbies",
                  value: {
                    football: ["psg", "nantes"],
                    golf: ["st andrews"],
                  },
                  previousValue: {
                    football: ["psg"],
                    rugby: ["france"],
                  },
                  status: "updated",
                  diff: [
                    {
                      key: "football",
                      value: ["psg", "nantes"],
                      previousValue: ["psg"],
                      status: "updated",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
  it("shows only added values in deeply nested objects", () => {
    expect(
      getObjectDiff(
        {
          id: 54,
          user: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                rugby: ["france"],
              },
            },
          },
        },
        {
          id: 54,
          user: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg", "nantes"],
                golf: ["st andrews"],
              },
            },
          },
        },
        {
          showOnly: {
            statuses: [ObjectStatus.ADDED],
            granularity: Granularity.DEEP,
          },
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          key: "user",
          value: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg", "nantes"],
                golf: ["st andrews"],
              },
            },
          },
          previousValue: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                rugby: ["france"],
              },
            },
          },
          status: "updated",
          diff: [
            {
              key: "data",
              value: {
                member: true,
                hobbies: {
                  football: ["psg", "nantes"],
                  golf: ["st andrews"],
                },
              },
              previousValue: {
                member: true,
                hobbies: {
                  rugby: ["france"],
                },
              },
              status: "updated",
              diff: [
                {
                  key: "hobbies",
                  value: {
                    football: ["psg", "nantes"],
                    golf: ["st andrews"],
                  },
                  previousValue: {
                    rugby: ["france"],
                  },
                  status: "updated",
                  diff: [
                    {
                      key: "football",
                      value: ["psg", "nantes"],
                      previousValue: undefined,
                      status: "added",
                    },
                    {
                      key: "golf",
                      value: ["st andrews"],
                      previousValue: undefined,
                      status: "added",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
  it("returns an empty diff if no key match the required statuses output", () => {
    expect(
      getObjectDiff(
        null,
        {
          name: "joe",
          age: 54,
          hobbies: ["golf", "football"],
        },
        {
          showOnly: {
            statuses: [ObjectStatus.DELETED],
            granularity: Granularity.DEEP,
          },
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "added",
      diff: [],
    });
  });
  it("returns all values if their status match the required statuses", () => {
    expect(
      getObjectDiff(
        { name: "joe", age: 54, hobbies: ["golf", "football"] },
        null,
        { showOnly: { statuses: [ObjectStatus.DELETED] } },
      ),
    ).toStrictEqual({
      type: "object",
      status: "deleted",
      diff: [
        {
          key: "name",
          value: undefined,
          previousValue: "joe",
          status: "deleted",
        },
        {
          key: "age",
          value: undefined,
          previousValue: 54,
          status: "deleted",
        },
        {
          key: "hobbies",
          value: undefined,
          previousValue: ["golf", "football"],
          status: "deleted",
        },
      ],
    });
  });
  it("detects changes when comparing an array value key to a non-array value key", () => {
    expect(
      getObjectDiff(
        {
          name: "joe",
          age: 55,
          hobbies: ["golf", "football"],
        },
        {
          name: "joe",
          age: 55,
          hobbies: null,
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          value: "joe",
          previousValue: "joe",
          key: "name",
          status: "equal",
        },
        {
          value: 55,
          previousValue: 55,
          key: "age",
          status: "equal",
        },
        {
          value: null,
          previousValue: ["golf", "football"],
          key: "hobbies",
          status: "updated",
        },
      ],
    });
  });
  it("detects changes when comparing a non-array value key to an array value key", () => {
    expect(
      getObjectDiff(
        {
          name: "joe",
          age: 55,
          hobbies: null,
        },
        {
          name: "joe",
          age: 55,
          hobbies: ["golf", "football"],
        },
      ),
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          value: "joe",
          previousValue: "joe",
          key: "name",
          status: "equal",
        },
        {
          value: 55,
          previousValue: 55,
          key: "age",
          status: "equal",
        },
        {
          value: ["golf", "football"],
          previousValue: null,
          key: "hobbies",
          status: "updated",
        },
      ],
    });
  });
});
