---
layout: post
title: JavaScript, Types and Sets - Part II (draft)
---

## Lists

Lists are a particular case of (possibly infinite) tuples `A × B × C ...` when A = B = C = ...

```js
// the list combinator

function list(type) {
  return function (arr) {
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

## Maybe

