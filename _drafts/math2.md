---
layout: post
title: JavaScript, Types and Sets - Part II (draft)
---

## Summary

In the [Part I](/2014/09/29/javascript-types-and-sets.html), I introduced two fundamental math concepts: sets, function.
Then I've implemented sets in JavaScript as functions and finally defined four type combinators:

- subtype
- enums
- tuple
- struct

which allow you to define new types from previous defined types.

Now I'll define other four useful type combinators.

## Lists and Dictionaries

Lists are a particular case of a (possibly infinite) tuple `A × B × C ...` when A = B = C = ...

```js
// the list combinator

function list(type) {
  return function List(arr) {
    // check input structure
    if ( !Array.isArray(arr) ) throw new TypeError();
    arr.forEach(function (element, i) {
      arr[i] = type(element); // check i-th coordinate and dehydrate nested structures
    });
    return Object.freeze(arr);
  };
}

var Hashtags = list(Str);
Hashtags(['#javascript', 1]); // => throws TypeError
Hashtags(['#javascript', '#types', '#sets']); // => ['#javascript', '#types', '#sets'] (immutable)
```

Dictionaries are a particular case of a (possibly inifnite) struct `A × B × C ...` when A = B = C = ...

```js
// the dict combinator

// helper
function isObject(x) {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function dict(type) {
  return function Dic(obj) {
    // check input structure
    if ( !isObject(obj) ) throw new TypeError();
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        obj[k] = type(obj[k]); // check prop and dehydrate nested structures
      }
    }
    return Object.freeze(obj);
  };
}

var Phonebook = dict(Num);

var phonebook = Phonebook({
  'Andrew Parson': 8806336,
  'Emily Everett': 6784346, 
  'Peter Power': 7658344
}); // => {'Andrew Parson': 8806336, 'Emily Everett': 6784346, 'Peter Power': 7658344} (immutable)
```

## Unions

The union of two sets A and B is the collection of points which are in A or in B or in both A and B.

Union is the trickiest type to implement since, given an input, generally it's not determined which of the types involved
must be used to handle it, even more if the sets involved are not disjoint, that is they have elements in common.
A solution would be to provide a `dispatch: Any -> Types U Nil` function that accepts the same input and returns the suitable type
(or undefined if it's not possible establish a type).

```js
// the union combinator

function union(types) {
  return function Union(x) {
    if ( typeof Union.dispatch !== 'function' ) throw new Error('unimplemented');
    var type = Union.dispatch(x);
    if ( typeof type !== 'function' ) throw new TypeError();
    return type(x);
  };
}
```

## Optional values

Optional values of type `Type` can be modeled as an union of `Nil` and `Type`.

```js
// the maybe combinator

function maybe(type) {
  var opt = union([Nil, type]);
  opt.dispatch = function (x) {
    return Nil.is(x) ? Nil : type;
  };
  return opt;
}

var OptionalStr = maybe(Str);

OptionalStr(1);         // => throws TypeError
OptionalStr(null);      // => null
OptionalStr(undefined); // => undefined
OptionalStr('hello');   // => 'hello'
```
