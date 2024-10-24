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

Most existing solutions return a confusing diff format that often requires extra parsing. They are also limited to object comparison.

**Superdiff** provides a complete and readable diff for both arrays **and** objects. Plus, it supports stream and file inputs for handling large datasets efficiently, is battle-tested, has zero dependencies, and is super fast. 

Import. Enjoy. 👍

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

**Superdiff** exports 5 functions:

```ts
// Returns a complete diff of two objects
getObjectDiff(prevObject, nextObject)

// Returns a complete diff of two arrays
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

Compares two objects and returns a diff for each value and its possible subvalues. Supports deeply nested objects of any value type.

#### FORMAT

**Input**

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

- `prevData`: the original object.
- `nextData`: the new object.
- `options`
  - `ignoreArrayOrder`: if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays contain the same values, just in a different order.
  - `showOnly`: returns only the values whose status you are interested in. It takes two parameters:

    - `statuses`: status you want to see in the output (e.g. `["added", "equal"]`)
      - `granularity`:
        - `basic` returns only the main properties whose status matches your query.
        - `deep` can return main properties if some of their subproperties' status match your request. The subproperties are filtered accordingly.

**Output**

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
#### USAGE

**Input**

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

**Output**

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

#### FORMAT

**Input**

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
- `prevList`: the original list.
- `nextList`: the new list.
- `options`
  - `showOnly` gives you the option to return only the values whose status you are interested in (e.g. `["added", "equal"]`).
  - `referenceProperty` will consider an object to be `updated` rather than `added` or `deleted` if one of its properties remains stable, such as its `id`. This option has no effect on other datatypes.
  - `ignoreArrayOrder`: if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays contain the same values, just in a different order.
  - `considerMoveAsUpdate`: if set to `true` a `moved` value will be considered as `updated`.

**Output**

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
#### USAGE

**Input**

```diff
getListDiff(
- ["mbappe", "mendes", "verratti", "ruiz"],
+ ["mbappe", "messi", "ruiz"]
);
```

**Output**

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
// If you are in a server environment
import { streamListDiff } from "@donedeal0/superdiff/server";
// If you are in a browser environment
import { streamListDiff } from "@donedeal0/superdiff/client";
```

Streams the diff of two object lists, ideal for large lists and maximum performance.

#### FORMAT

**Input**

#### Server

> In a server environment, `Readable` refers to Node.js streams, and `FilePath` refers to the path of a file (e.g., `./list.json`). Examples are provided in the #usage section below.

```ts
 prevList: Readable | FilePath | Record<string, unknown>[],
 nextList: Readable | FilePath | Record<string, unknown>[],
 referenceProperty: keyof Record<string, unknown>,
 options: {
  showOnly?: ("added" | "deleted" | "moved" | "updated" | "equal")[], // [] by default
  chunksSize?: number, // 0 by default
  considerMoveAsUpdate?: boolean; // false by default
}
```

#### Browser

> In a browser environment, `ReadableStream` refers to the browser's streaming API, and `File` refers to an uploaded or local file. Examples are provided in the #usage section below.

```ts
 prevList: ReadableStream<Record<string, unknown>> | File | Record<string, unknown>[],
 nextList: ReadableStream<Record<string, unknown>> | File | Record<string, unknown>[],
 referenceProperty: keyof Record<string, unknown>,
 options: {
  showOnly?: ("added" | "deleted" | "moved" | "updated" | "equal")[], // [] by default
  chunksSize?: number, // 0 by default
  considerMoveAsUpdate?: boolean; // false by default
}
```

- `prevList`: the original object list.
- `nextList`: the new object list.
- `referenceProperty`: a property common to all objects in your lists (e.g. `id`).
- `options`
  - `chunksSize` the number of object diffs returned by each streamed chunk. (e.g. `0` = 1 object diff per chunk, `10` = 10 object diffs per chunk).
  - `showOnly` gives you the option to return only the values whose status you are interested in (e.g. `["added", "equal"]`).
  - `considerMoveAsUpdate`: if set to `true` a `moved` value will be considered as `updated`.

**Output**

The objects diff are grouped into arrays - called `chunks` - and are consumed thanks to an event listener. You have access to 3 events: 
  - `data`: to be notified when a new chunk of object diffs is available.
  - `finish`: to be notified when the stream is finished.
  - `error`: to be notified if an error occurs during the stream.

```ts
interface StreamListener<T extends Record<string, unknown>> {
  on<E extends keyof EmitterEvents<T>>(
    event: E,
    listener: Listener<EmitterEvents<T>[E]>,
  ): this;
}

type EmitterEvents<T extends Record<string, unknown>> = {
  data: [StreamListDiff<T>[]];
  error: [Error];
  finish: [];
};


type StreamListDiff<T extends Record<string, unknown>> = {
  currentValue: T | null;
  previousValue: T | null;
  prevIndex: number | null;
  newIndex: number | null;
  indexDiff: number | null;
  status: "added" | "deleted" | "moved" | "updated" | "equal";
};
```

#### USAGE

**Input**

You can send streams, file paths, or arrays as input:

> If you are in a server environment

```ts
    // for a simple array
    const stream = [{ id: 1, name: "hello" }]
    // for a large array 
    const stream = Readable.from(list, { objectMode: true });
    // for a local file
    const stream = path.resolve(__dirname, "./list.json");
   
```

> If you are in a browser environment

```ts
    // for a simple array 
    const stream = [{ id: 1, name: "hello" }]
    // for a large array 
    const stream = new ReadableStream({
      start(controller) {
        list.forEach((value) => controller.enqueue(value));
        controller.close();
      },
    }); 
    // for a local file
    const stream = new File([JSON.stringify(file)], "file.json", { type: "application/json" }); 
    // for a file input
    const stream = e.target.files[0]; 

```
> Example

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
 
**Output**

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

diff.on("finish", () => console.log("Your data has been processed. The full diff is available."))
diff.on("error", (err) => console.log(err))
```

<hr/>

### isEqual()

```js
import { isEqual } from "@donedeal0/superdiff";
```

Tests whether two values are equal.

#### FORMAT

**Input**

```ts
a: unknown,
b: unknown,
options: { 
    ignoreArrayOrder: boolean; // false by default
     },
```
- `a`: the value to be compared to the value `b`.
- `b`: the value to be compared to the value `a`.
- `ignoreArrayOrder`: if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays contain the same values, just in a different order.

#### USAGE


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

**Output**

```ts
false;
```
<hr/>

### isObject()

```js
import { isObject } from "@donedeal0/superdiff";
```

Tests whether a value is an object.

#### FORMAT

**Input**

```ts
value: unknown;
```

- `value`: the value whose type will be checked.

#### USAGE

**Input**

```ts
isObject(["hello", "world"]);
```

**Output**

```ts
false;
```

<hr/>

### ℹ️ More examples are available in the source code tests.


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

Issues and pull requests are welcome!
