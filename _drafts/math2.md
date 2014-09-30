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

## Lists

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

> **Note**. In [JavaScript, Types and Sets - Part I](/2014/09/29/javascript-types-and-sets.html) I showed how hashes can be viewed as functions, well it turns out that lists also can be viewed as functions:

```js
// f: Num -> Str
// f(0) = 'a'
// f(1) = 'b'
// f(2) = 'c'
// ore more succinctly..
var f = ['a', 'b', 'c'];
// where we exploit the set of the list indexes as domain of the function
```

## Dictionaries

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
(or undefined if it's not possible to establish the type).

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

var CssWidth = union([Str, Num]);
CssWidth.dispatch = function (x) {
  if (typeof x === 'string') return Str;
  if (typeof x === 'number') return Num;
};

CssWidth(true);   // => throws TypeError
CssWidth(10);     // => 10
CssWidth('10px'); // => '12px'
```

Sometimes it's not so easy to define the `dispatch` function, specially when the types involved overlap (that is the underlying sets are not disjoint). I'll consider in the worst case, when the involved types seems all the same.

```js
var Employer = struct({
  name: Str,
  surname: Str
});

var Employee = struct({
  name: Str,
  surname: Str
});

var Person = union([Employer, Employee]);

Person.dispatch = function (x) {
  ???
};
```

This is a good case for implementing a **tagged union**. From [Wikipedia](http://en.wikipedia.org/wiki/Tagged_union): "A tagged union is a data structure used to hold a value that could take on several different, but fixed types. Only one of the types can be in use at any one time, and a tag field explicitly indicates which one is in use".

```js
var Employer = struct({
  name: Str,
  surname: Str
});

// helps JSON deserialization
Employer.prototype.toJSON = function () {
  return mixin({tag: 'Employer'}, this);
};

var Employee = struct({
  name: Str,
  surname: Str
});

// helps JSON deserialization
Employer.prototype.toJSON = function () {
  return mixin({tag: 'Employee'}, this);
};

var Person = union([Employer, Employee]);

Person.dispatch = function (x) {
  if (x.tag === 'Employer') return Employer;
  if (x.tag === 'Employee') return Employee;
};

new Person({
  tag: 'Employer', 
  name: 'Mark', 
  surname: 'Zuckerberg'
}); // => new Employer({name: 'Mark', surname: 'Zuckerberg'});

new Person({
  tag: 'Employee', 
  name: 'Giulio', 
  surname: 'Canti'
}); // => new Employee({name: 'Giulio', surname: 'Canti'});
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
