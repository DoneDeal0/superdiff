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

**Superdiff** gives you a complete diff for both array <u>and</u> objects in a very readable format. Last but not least, it's battle-tested and super fast. Import. Enjoy. 👍

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
    previousValue: unknown;
    currentValue: unknow;
    status: "added" | "deleted" | "equal" | "updated";
    // only appears if some subproperties have been added/deleted/updated
    diff?: {
      property: string;
      previousValue: unknown;
      currentValue: unknown;
      status: "added" | "deleted" | "equal" | "updated";
      // recursive diff in case of subproperties
      diff?: SubDiff[];
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
    value: unknown;
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
  ignoreArrayOrder?: boolean // false by default,
}
```

- `showOnly` gives you the option to return only the values whose status you are interested in (e.g. `["added", "equal"]`).
- `referenceProperty` will consider an object to be updated instead of added or deleted if one of its properties remains stable, such as its `id`. This option has no effect on other datatypes.
- `ignoreArrayOrder`: if set to `true`, `["hello", "world"]` and `["world", "hello"]` will be treated as `equal`, because the two arrays have the same value, just not in the same order.

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

<hr/>

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
  ],
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

If you or your company uses **Superdiff**, please show your support by becoming a sponsor! Your name and company logo will be displayed on the `README.md`. https://github.com/sponsors/DoneDeal0

<br/>
<a href="https://github.com/sponsors/DoneDeal0" target="_blank">
<img alt="sponsor" src="https://github.com/DoneDeal0/superdiff/assets/43271780/21deb4f3-fee3-4bf9-a945-ed0b77c6f82f"/>
</a>
<br/>

## CONTRIBUTING

Pull requests are welcome!
