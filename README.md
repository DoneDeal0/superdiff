<img width="722" alt="superdiff-logo" src="https://user-images.githubusercontent.com/43271780/209532864-24d7449e-1185-4810-9423-be5df1fe877f.png">

# SUPERDIFF

This library compares two arrays or objects and returns a full diff of their differences.

[![Superdiff CI](https://github.com/DoneDeal0/superdiff/actions/workflows/superdiff.yml/badge.svg)](https://github.com/DoneDeal0/superdiff/actions/workflows/superdiff.yml)

## WHY YOU SHOULD USE THIS LIBRARY

All other existing solutions return a strange diff format that often requires additional parsing. They are also limited to object comparison. 👎

**Superdiff** gives you a complete diff for both array <u>and</u> objects in a very readable format. Last but not least, it's battle-tested and super fast. Import. Enjoy. 👍

## DIFF FORMAT COMPARISON

Let's compare the diff format of **Superdiff** and **Deep-diff**, the most popular diff lib on npm:

input:

```diff
const objectA = {
          id: 54,
          user: {
            name: "joe",
-           member: true,
-           hobbies: ["golf", "football"],
            age: 66,
         },
  }

const objectB = {
        id: 54,
        user: {
            name: "joe",
+           member: false,
+           hobbies: ["golf", "chess"],
            age: 66,
        },
  }
```

**Deep-Diff** output:

```js
[
  {
    kind: "E",
    path: ["user", "member"],
    lhs: true,
    rhs: false,
  },
  {
    kind: "E",
    path: ["user", "hobbies", 1],
    lhs: "football",
    rhs: "chess",
  },
];
```

**SuperDiff** output:

```diff
{
      type: "object",
+     status: "updated",
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
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
          currentValue: {
            name: "joe",
            member: false,
            hobbies: ["golf", "chess"],
            age: 66,
          },
+         status: "updated",
          subPropertiesDiff: [
            {
              property: "name",
              previousValue: "joe",
              currentValue: "joe",
              status: "equal",
            },
+           {
+             property: "member",
+             previousValue: true,
+             currentValue: false,
+             status: "updated",
+           },
+           {
+             property: "hobbies",
+             previousValue: ["golf", "football"],
+             currentValue: ["golf", "chess"],
+             status: "updated",
+           },
            {
              property: "age",
              previousValue: 66,
              currentValue: 66,
              status: "equal",
            },
          ],
        },
      ],
    }
```

## FEATURES

**Superdiff** exports 4 functions:

### getObjectDiff()

```js
import { getObjectDiff } from "@donedeal0/superdiff";
```

Compares two objects and return a diff for each value and their potential subvalues:

- property name
- status: `added`, `deleted`, `equal`, `updated`
- previous value, current value
- supports deeply nested objects with any kind of values

format:

```ts
type ObjectDiff = {
  type: "object";
  status: "added" | "deleted" | "equal" | "updated";
  diff: {
    property: string;
    previousValue: any;
    currentValue: any;
    status: "added" | "deleted" | "equal" | "updated";
    // only appears if some subproperties have been added/deleted/updated
    subPropertiesDiff?: {
      property: string;
      previousValue: any;
      currentValue: any;
      status: "added" | "deleted" | "equal" | "updated";
      // subDiff is a recursive diff in case of nested subproperties
      subDiff?: SubProperties[];
    }[];
  }[];
};
```

**Options**

You can add a third `options` parameter to `getObjectDiff`.

```ts
{
  ignoreArrayOrder?: boolean // false by default,
  showOnly?: {
    statuses: ("added" | "deleted" | "updated" | "equal")[], // [] by default
    granularity?: "basic" | "deep" // "basic" by default
  }
}
```

- `ignoreArrayOrder`: if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.
- `showOnly`: returns only the values whose status you are interested in. It takes two parameters:

  - `statuses`: status you want to see in the output (e.g. `["added", "equal"]`)
    - `granularity`:
      - `basic` returns only the main properties whose status matches your query.
      - `deep` can return main properties if some of their subproperties' status match your request. The subproperties are filtered accordingly.

### getListDiff()

```js
import { getListDiff } from "@donedeal0/superdiff";
```

Compares two arrays and returns a diff for each value:

- index change: `prevIndex`, `newIndex`, `indexDiff`
- status: `added`, `deleted`, `equal`, `moved`, `updated`
- value
- supports arrays of primitive values and objects
- supports arrays with duplicate values

format:

```ts
type ListDiff = {
  type: "list";
  status: "added" | "deleted" | "equal" | "moved" | "updated";
  diff: {
    value: any;
    prevIndex: number | null;
    newIndex: number | null;
    indexDiff: number | null;
    status: "added" | "deleted" | "equal" | "moved" | "updated";
  }[];
};
```

**Options**

You can add a third `options` parameter to `getListDiff`.

```ts
{
  showOnly?: ("added" | "deleted" | "moved" | "updated" | "equal")[], // [] by default
  referenceProperty?: string; // "" by default
}
```

- `showOnly` gives you the option to return only the values whose status you are interested in (e.g. `["added", "equal"]`).
- `referenceProperty` will consider an object to be updated instead of added or deleted if one of its properties remains stable, such as its `id`. This option has no effect on other datatypes.

### isEqual()

```js
import { isEqual } from "@donedeal0/superdiff";
```

Tests whether two values are equal.

**Options**

You can add a third `options` parameter to `isEqual`.

```ts
{
  ignoreArrayOrder?: boolean // false by default,
}
```

- `ignoreArrayOrder`: if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.

### isObject()

```js
import { isObject } from "@donedeal0/superdiff";
```

Tests whether a value is an object.

## EXAMPLES

### getListDiff()

input

```diff
getListDiff(
- ["mbappe", "mendes", "verratti", "ruiz"],
+ ["mbappe", "messi", "ruiz"]
);
```

output

```diff
{
      type: "list",
+     status: "updated",
      diff: [
        {
          value: "mbappe",
          prevIndex: 0,
          newIndex: 0,
          indexDiff: 0,
          status: "equal",
        },
-       {
-         value: "mendes",
-         prevIndex: 1,
-         newIndex: null,
-         indexDiff: null,
-         status: "deleted",
-       },
-       {
-         value: "verratti",
-         prevIndex: 2,
-         newIndex: null,
-         indexDiff: null,
-         status: "deleted",
-       },
+       {
+         value: "messi",
+         prevIndex: null,
+         newIndex: 1,
+         indexDiff: null,
+         status: "added",
+       },
+       {
+         value: "ruiz",
+         prevIndex: 3,
+         newIndex: 2,
+         indexDiff: -1,
+         status: "moved",
        },
      ],
    }
```

### getObjectDiff()

input

```diff
getObjectDiff(
  {
    id: 54,
    user: {
      name: "joe",
-     member: true,
-     hobbies: ["golf", "football"],
      age: 66,
    },
  },
  {
    id: 54,
    user: {
      name: "joe",
+     member: false,
+     hobbies: ["golf", "chess"],
      age: 66,
    },
  }
);
```

output

```diff
{
      type: "object",
+     status: "updated",
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
            member: true,
            hobbies: ["golf", "football"],
            age: 66,
          },
          currentValue: {
            name: "joe",
            member: false,
            hobbies: ["golf", "chess"],
            age: 66,
          },
+         status: "updated",
          subPropertiesDiff: [
            {
              property: "name",
              previousValue: "joe",
              currentValue: "joe",
              status: "equal",
            },
+           {
+             property: "member",
+             previousValue: true,
+             currentValue: false,
+             status: "updated",
+           },
+           {
+             property: "hobbies",
+             previousValue: ["golf", "football"],
+             currentValue: ["golf", "chess"],
+             status: "updated",
+           },
            {
              property: "age",
              previousValue: 66,
              currentValue: 66,
              status: "equal",
            },
          ],
        },
      ],
    }
```

### isEqual()

```js
isEqual(
  [
    { name: "joe", age: 99 },
    { name: "nina", age: 23 },
  ],
  [
    { name: "joe", age: 98 },
    { name: "nina", age: 23 },
  ]
);
```

output

```js
false;
```

### isObject()

input

```js
isObject(["hello", "world"]);
```

output

```js
false;
```

More examples are available in the source code tests.

<hr/>

## CREDITS

DoneDeal0

## SUPPORT

If you or your company use Superdiff, please show your support by buying me a coffee:
https://www.buymeacoffee.com/donedeal0

<br/>
<a href="https://www.buymeacoffee.com/donedeal0" target="_blank">
<img src="https://user-images.githubusercontent.com/43271780/178990049-46b05704-1344-4d55-a5a7-7265724edc5c.png"/>
</a>
<br/>

## CONTRIBUTING

Pull requests are welcome!
