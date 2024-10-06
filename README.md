<img width="722" alt="superdiff-logo" src="https://user-images.githubusercontent.com/43271780/209532864-24d7449e-1185-4810-9423-be5df1fe877f.png">


[![CI](https://github.com/DoneDeal0/superdiff/actions/workflows/ci.yml/badge.svg)](https://github.com/DoneDeal0/superdiff/actions/workflows/ci.yml)
[![CD](https://github.com/DoneDeal0/superdiff/actions/workflows/cd.yml/badge.svg)](https://github.com/DoneDeal0/superdiff/actions/workflows/cd.yml)
![NPM Downloads](https://img.shields.io/npm/dy/%40donedeal0%2Fsuperdiff?logo=npm)
![GitHub Tag](https://img.shields.io/github/v/tag/DoneDeal0/superdiff?label=latest%20release)

<hr/>

# WHAT IS IT?

This library compares two arrays or objects and returns a full diff of their differences.

<hr/>

## WHY YOU SHOULD USE THIS LIBRARY

All other existing solutions return a strange diff format that often requires additional parsing. They are also limited to object comparison.

**Superdiff** gives you a complete diff for both array <u>and</u> objects in a very readable format. Last but not least, it's battle-tested, has zero dependencies, and is super fast. Import. Enjoy. 👍

<hr/>

## DONORS

I am grateful to the generous donors of **Superdiff**!

 <div style="display: flex;>
           
<a href="https://github.com/AlexisAnzieu" target="_blank"><img alt="AlexisAnzieu" src="https://github.com/DoneDeal0/superdiff/assets/43271780/8e9fb627-36ec-479d-87d4-3ca2cb2a796c" width="72px" height="72px"/></a>
<a href="https://github.com/omonk" target="_blank"><img alt="omonk" src="https://github.com/DoneDeal0/superdiff/assets/43271780/6c040ab4-f6eb-49bf-a737-d138264abbd7" width="72px" height="72px"/></a>
<a href="https://github.com/sneko" target="_blank"><img alt="sneko" src="https://github.com/DoneDeal0/superdiff/assets/43271780/2caaa70b-9586-44d6-8b3a-3755bba7b1ca" width="72px" height="72px"/></a>

 </div>

 <hr/>

## FEATURES

**Superdiff** exports 4 functions:

```ts
// Compares two objects and return a diff for each value and their potential subvalues
getObjectDiff(prevObject, nextObject)
// Compares two arrays and returns a diff for each value
getListDiff(prevList, nextList)
// Streams the diff of two object lists, ideal for large lists and maximum performance
streamListDiff(prevList, nextList, referenceProperty)
// Checks whether two values are equal 
isEqual(dataA, dataB)
// Checks whether a value is an object
isObject(data)
```
<hr/>

### getObjectDiff()

```js
import { getObjectDiff } from "@donedeal0/superdiff";
```

Compares two objects and return a diff for each value and their potential subvalues. Supports deeply nested objects with any kind of values.

**Format**

input

```ts
prevData: Record<string, unknown>;
nextData: Record<string, unknown>;
options?: {
  ignoreArrayOrder?: boolean, // false by default,
  showOnly?: {
    statuses: ("added" | "deleted" | "updated" | "equal")[], // [] by default
    granularity?: "basic" | "deep" // "basic" by default
  }
}
```

- `prevData`: the original object
- `nextData`: the new object
- `options`
  - `ignoreArrayOrder`: if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.
  - `showOnly`: returns only the values whose status you are interested in. It takes two parameters:

    - `statuses`: status you want to see in the output (e.g. `["added", "equal"]`)
      - `granularity`:
        - `basic` returns only the main properties whose status matches your query.
        - `deep` can return main properties if some of their subproperties' status match your request. The subproperties are filtered accordingly.

output 

```ts
type ObjectDiff = {
  type: "object";
  status: "added" | "deleted" | "equal" | "updated";
  diff: Diff[];
};

/** recursive diff in case of subproperties */
type Diff = {
  property: string;
  previousValue: unknown;
  currentValue: unknown;
  status: "added" | "deleted" | "equal" | "updated";
  diff?: Diff[];
};
```
**Usage**

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
          diff: [
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
<hr/>

### getListDiff()

```js
import { getListDiff } from "@donedeal0/superdiff";
```

Compares two arrays and returns a diff for each entry. Supports duplicate values, primitive values and objects.

**Format**

input

```ts
  prevList: T[];
  nextList: T[];
  options?: {
    showOnly?: ("added" | "deleted" | "moved" | "updated" | "equal")[], // [] by default
    referenceProperty?: string, // "" by default
    ignoreArrayOrder?: boolean, // false by default,
    considerMoveAsUpdate?: boolean // false by default
  }
```
- `prevList`: the original list
- `nextList`: the new list
- `options`
  - `showOnly` gives you the option to return only the values whose status you are interested in (e.g. `["added", "equal"]`).
  - `referenceProperty` will consider an object to be updated instead of added or deleted if one of its properties remains stable, such as its `id`. This option has no effect on other datatypes.
  - `ignoreArrayOrder`: if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.
  - `considerMoveAsUpdate`: if set to `true` the `moved` value will be considered as `updated`.

output

```ts
type ListDiff = {
  type: "list";
  status: "added" | "deleted" | "equal" | "moved" | "updated";
  diff: {
    value: unknown;
    prevIndex: number | null;
    newIndex: number | null;
    indexDiff: number | null;
    status: "added" | "deleted" | "equal" | "moved" | "updated";
  }[];
};
```
**Usage**

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
<hr/>

### streamListDiff()

```js
import { streamListDiff } from "@donedeal0/superdiff";
```

Streams the diff of two object lists, ideal for large lists and maximum performance.

**Format**

input

```ts
 prevList: T[],
 nextList: T[],
 referenceProperty: ReferenceProperty<T>,
 options: {
  showOnly?: returns only the values whose status you are interested in. (e.g. `["added", "equal"]`), // [] by default
  chunksSize?: number, // // 0 by default
  considerMoveAsUpdate? boolean; // false by default
}
```

- `prevList`: the original object list.
- `nextList`: the new object list.
- `referenceProperty`: a common property in all the objects of your lists (e.g. `id`).
- `options`
  - `chunksSize` the number of object diffs returned by each stream chunk. If set to `0`, each stream will return a single object diff. If set to `10` each stream will return 10 object diffs.
  - `showOnly` gives you the option to return only the values whose status you are interested in (e.g. `["added", "equal"]`).
  - `considerMoveAsUpdate`: if set to `true` the `moved` value will be considered as `updated`.

output

```ts
type StreamListDiff<T extends Record<string, unknown>> = {
  currentValue: T | null;
  previousValue: T | null;
  prevIndex: number | null;
  newIndex: number | null;
  indexDiff: number | null;
  status: "added" | "deleted" | "moved" | "updated" | "equal";
};
```

**Usage**

input

```diff
const diff = streamListDiff(
      [ 
-       { id: 1, name: "Item 1" },  
        { id: 2, name: "Item 2" },
        { id: 3, name: "Item 3" } 
      ],
      [
+       { id: 0, name: "Item 0" }, 
        { id: 2, name: "Item 2" },
+       { id: 3, name: "Item Three" },
      ],
      "id", 
      { chunksSize: 2 }
    );
```
 
output

```diff
diff.on("data", (chunk) => {
      // first chunk received (2 object diffs)
      [
+       {
+         previousValue: null,
+         currentValue: { id: 0, name: 'Item 0' },
+         prevIndex: null,
+         newIndex: 0,
+         indexDiff: null,
+         status: 'added'
+       },
-       {
-         previousValue: { id: 1, name: 'Item 1' },
-         currentValue: null,
-         prevIndex: 0,
-         newIndex: null,
-         indexDiff: null,
-         status: 'deleted'
-       }
      ]
    // second chunk received (2 object diffs)
      [
        {
          previousValue: { id: 2, name: 'Item 2' },
          currentValue: { id: 2, name: 'Item 2' },
          prevIndex: 1,
          newIndex: 1,
          indexDiff: 0,
          status: 'equal'
        },
+       {
+         previousValue: { id: 3, name: 'Item 3' },
+         currentValue: { id: 3, name: 'Item Three' },
+         prevIndex: 2,
+         newIndex: 2,
+         indexDiff: 0,
+         status: 'updated'
+       },
     ]
});

diff.on("finish", () => console.log("The full diff is available"))
diff.on("error", (err)=> console.log(err))
```
<hr/>

### isEqual()

```js
import { isEqual } from "@donedeal0/superdiff";
```

Checks whether two values are equal.

**Options**

You can add a third `options` parameter to `isEqual`.

```ts
{
  ignoreArrayOrder?: boolean // false by default,
}
```

- `ignoreArrayOrder`: if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.

**Usage**


```ts
isEqual(
  [
    { name: "joe", age: 99 },
    { name: "nina", age: 23 },
  ],
  [
    { name: "joe", age: 98 },
    { name: "nina", age: 23 },
  ],
);
```

output

```ts
false;
```
<hr/>

### isObject()

```js
import { isObject } from "@donedeal0/superdiff";
```

Tests whether a value is an object.

**Usage**

input

```ts
isObject(["hello", "world"]);
```

output

```ts
false;
```

<hr/>

### More examples are available in the source code tests.

<hr/>

## CREDITS

DoneDeal0

## SUPPORT

If you or your company uses **Superdiff**, please show your support by becoming a sponsor! Your name and company logo will be displayed on the `README.md`. Premium support is also available. https://github.com/sponsors/DoneDeal0

<br/>
<a href="https://github.com/sponsors/DoneDeal0" target="_blank">
<img alt="sponsor" src="https://github.com/DoneDeal0/superdiff/assets/43271780/21deb4f3-fee3-4bf9-a945-ed0b77c6f82f"/>
</a>
<br/>

## CONTRIBUTING

Pull requests are welcome!
