import { getObjectDiff } from "../src/object-diff";

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
        null
      )
    ).toStrictEqual({
      type: "object",
      status: "deleted",
      diff: [
        {
          property: "name",
          previousValue: "joe",
          currentValue: undefined,
          status: "deleted",
        },
        {
          property: "age",
          previousValue: 54,
          currentValue: undefined,
          status: "deleted",
        },
        {
          property: "hobbies",
          previousValue: ["golf", "football"],
          currentValue: undefined,
          status: "deleted",
        },
      ],
    });
  });
  it("consider next object as completely added if no previous object is provided", () => {
    expect(
      getObjectDiff(null, {
        name: "joe",
        age: 54,
        hobbies: ["golf", "football"],
      })
    ).toStrictEqual({
      type: "object",
      status: "added",
      diff: [
        {
          property: "name",
          previousValue: undefined,
          currentValue: "joe",
          status: "added",
        },
        {
          property: "age",
          previousValue: undefined,
          currentValue: 54,
          status: "added",
        },
        {
          property: "hobbies",
          previousValue: undefined,
          currentValue: ["golf", "football"],
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
        }
      )
    ).toStrictEqual({
      type: "object",
      status: "equal",
      diff: [
        {
          property: "age",
          previousValue: 66,
          currentValue: 66,
          status: "equal",
        },
        {
          property: "member",
          previousValue: false,
          currentValue: false,
          status: "equal",
        },
        {
          property: "promoCode",
          previousValue: null,
          currentValue: null,
          status: "equal",
        },
        {
          property: "city",
          previousValue: undefined,
          currentValue: undefined,
          status: "equal",
        },
        {
          property: "hobbies",
          previousValue: ["golf", "football"],
          currentValue: ["golf", "football"],
          status: "equal",
        },
        {
          property: "options",
          previousValue: { vegan: undefined, phone: null },
          currentValue: { vegan: undefined, phone: null },
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
        }
      )
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          property: "id",
          previousValue: 54,
          currentValue: 54,
          status: "equal",
        },
        {
          property: "country",
          previousValue: undefined,
          currentValue: "us",
          status: "added",
        },
        {
          property: "user",
          previousValue: {
            name: "joe",
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
          currentValue: {
            name: "joe",
            member: false,
            hobbies: ["golf", "chess"],
            nickname: "super joe",
          },
          status: "updated",
          subPropertiesDiff: [
            {
              name: "age",
              previousValue: 66,
              currentValue: undefined,
              status: "deleted",
            },
            {
              name: "name",
              previousValue: "joe",
              currentValue: "joe",
              status: "equal",
            },
            {
              name: "member",
              previousValue: true,
              currentValue: false,
              status: "updated",
            },
            {
              name: "hobbies",
              previousValue: ["golf", "football"],
              currentValue: ["golf", "chess"],
              status: "updated",
            },
            {
              name: "nickname",
              previousValue: undefined,
              currentValue: "super joe",
              status: "added",
            },
          ],
        },
        {
          property: "type",
          previousValue: "sport",
          currentValue: undefined,
          status: "deleted",
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
        }
      )
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          property: "id",
          previousValue: 54,
          currentValue: 54,
          status: "equal",
        },
        {
          property: "user",
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
          currentValue: {
            name: "joe",
            data: {
              member: true,
              hobbies: {
                football: ["psg", "nantes"],
                golf: ["st andrews"],
              },
            },
          },
          status: "updated",
          subPropertiesDiff: [
            {
              name: "name",
              previousValue: "joe",
              currentValue: "joe",
              status: "equal",
            },
            {
              name: "data",
              previousValue: {
                member: true,
                hobbies: {
                  football: ["psg"],
                  rugby: ["france"],
                },
              },
              currentValue: {
                member: true,
                hobbies: {
                  football: ["psg", "nantes"],
                  golf: ["st andrews"],
                },
              },
              status: "updated",
              subDiff: [
                {
                  name: "member",
                  previousValue: true,
                  currentValue: true,
                  status: "equal",
                },
                {
                  name: "hobbies",
                  previousValue: {
                    football: ["psg"],
                    rugby: ["france"],
                  },
                  currentValue: {
                    football: ["psg", "nantes"],
                    golf: ["st andrews"],
                  },
                  status: "updated",
                  subDiff: [
                    {
                      name: "rugby",
                      previousValue: ["france"],
                      currentValue: undefined,
                      status: "deleted",
                    },
                    {
                      name: "football",
                      previousValue: ["psg"],
                      currentValue: ["psg", "nantes"],
                      status: "updated",
                    },
                    {
                      name: "golf",
                      previousValue: undefined,
                      currentValue: ["st andrews"],
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
  it("detects changed between two objects BUT doesn't care about array order as long as all values are preserved when discardArrayOrder option is activated", () => {
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
        { discardArrayOrder: true }
      )
    ).toStrictEqual({
      type: "object",
      status: "updated",
      diff: [
        {
          property: "id",
          previousValue: 54,
          currentValue: 54,
          status: "equal",
        },
        {
          property: "country",
          previousValue: undefined,
          currentValue: "us",
          status: "added",
        },
        {
          property: "user",
          previousValue: {
            name: "joe",
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
          currentValue: {
            name: "joe",
            member: false,
            hobbies: ["football", "golf"],
            nickname: "super joe",
          },
          status: "updated",
          subPropertiesDiff: [
            {
              name: "age",
              previousValue: 66,
              currentValue: undefined,
              status: "deleted",
            },
            {
              name: "name",
              previousValue: "joe",
              currentValue: "joe",
              status: "equal",
            },
            {
              name: "member",
              previousValue: true,
              currentValue: false,
              status: "updated",
            },
            {
              name: "hobbies",
              previousValue: ["golf", "football"],
              currentValue: ["football", "golf"],
              status: "equal",
            },
            {
              name: "nickname",
              previousValue: undefined,
              currentValue: "super joe",
              status: "added",
            },
          ],
        },
        {
          property: "type",
          previousValue: "sport",
          currentValue: undefined,
          status: "deleted",
        },
      ],
    });
  });
});
