<img width="722" alt="superdiff-logo" src="https://user-images.githubusercontent.com/43271780/209532864-24d7449e-1185-4810-9423-be5df1fe877f.png">

# SUPERDIFF

This library compares two arrays or objects and return a complete diff of their differences.

## WHY YOU SHOULD USE THIS LIB

All other existing solutions return a weird diff format which often require an additional parsing. They are also slow and limited to object comparison. 👎

**Superdiff** gives you a complete diff for both array <u>and</u> objects with a very readable format. Last but not least, it's battled tested and super fast. Import. Enjoy. 👍

Benchmark for 10k objects:

- **Superdiff**: 256 ops/sec ⚡
- **Deep-diff**: 35.98 ops/sec 🐢

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
 DiffEdit {
   kind: 'E',
   path: [ 'user', 'member' ],
   lhs: true,
   rhs: false
 },
 DiffEdit {
   kind: 'E',
   path: [ 'user', 'hobbies', 1 ],
   lhs: 'football',
   rhs: 'chess'
 }
]

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
              name: "name",
              previousValue: "joe",
              currentValue: "joe",
              status: "equal",
            },
+           {
+             name: "member",
+             previousValue: true,
+             currentValue: false,
+             status: "updated",
+           },
+           {
+             name: "hobbies",
+             previousValue: ["golf", "football"],
+             currentValue: ["golf", "chess"],
+             status: "updated",
+           },
            {
              name: "age",
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
  status: "added" | "deleted" | "equal" | "moved" | "updated";
  diff: {
    property: string;
    previousValue: any;
    currentValue: any;
    status: "added" | "deleted" | "equal" | "moved" | "updated";
    subPropertiesDiff?: {
      name: string;
      previousValue: any;
      currentValue: any;
      status: "added" | "deleted" | "equal" | "moved" | "updated";
      // subDiff is a recursive diff in case of nested subproperties
      subDiff?: Subproperties[];
    }[];
  }[];
};
```

### getListDiff()

```js
import { getListDiff } from "@donedeal0/superdiff";
```

Compares two arrays and return a diff for each value:

- index change: `prevIndex`, `newIndex`, `indexDiff`
- status: `added`, `deleted`, `equal`, `moved`, `updated`
- value
- supports array of primitive values and objects
- ⚠️ doesn't support duplicated values comparison yet (but will soon)

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

### isEqual()

```js
import { isEqual } from "@donedeal0/superdiff";
```

Checks if two values are equal.

### isObject()

```js
import { isObject } from "@donedeal0/superdiff";
```

Checks if a value is an object.

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
              name: "name",
              previousValue: "joe",
              currentValue: "joe",
              status: "equal",
            },
+           {
+             name: "member",
+             previousValue: true,
+             currentValue: false,
+             status: "updated",
+           },
+           {
+             name: "hobbies",
+             previousValue: ["golf", "football"],
+             currentValue: ["golf", "chess"],
+             status: "updated",
+           },
            {
              name: "age",
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

More examples are availble in the tests of the source code.

## CREDITS

DoneDeal0

## CONTRIBUTING

Pull requests are welcome!
