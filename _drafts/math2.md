---
layout: post
title: JavaScript, Types and Sets - Part II (draft)
---

## Lists

Lists are a particular case of a (possibly infinite) tuple `A × B × C ...` when A = B = C = ...

```js
// the list combinator

function list(type) {
  return function List(arr) {
    if ( !Array.isArray(arr) ) throw new TypeError();
    arr.forEach(function (element) {
      type(element);
    }),
    return Object.freeze(arr);
  };
}

var Hashtags = list(Str);
Hashtags(['#javascript', 1]); // => throws TypeError
Hashtags(['#javascript', '#types', '#sets']); // => ['#javascript', '#types', '#sets'] (immutable)
```

## Unions

The union of two sets A and B is the collection of points which are in A or in B or in both A and B.

```js
// the union combinator

function union(types) {
  return function Union(x) {
    var type = Union.dispatch(x);
    return type(x);
  };
}
```

## Optional values

