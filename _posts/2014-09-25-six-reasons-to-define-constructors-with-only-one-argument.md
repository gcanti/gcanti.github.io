---
layout: post
title: Six reasons to define constructors with only one argument
---

## Introduction

This is how to define a "class" in vanilla JavaScript (further referred to as `vanilla`):

```js
function VanillaPerson(name, surname) { // multiple arguments
  this.name = name;
  this.surname = surname;
}

var person = new VanillaPerson('Giulio', 'Canti');
person.name; // => 'Giulio'
```

And this is the same class defined with a constructor with only one argument (further referred to as `1-arity`):

```js
function Person(obj) { // only one argument
  this.name = obj.name;
  this.surname = obj.surname;
}

var person = new Person({name: 'Giulio', surname: 'Canti'});
person.name; // => 'Giulio'
```

**I'll list the reasons why I think the latter is a better choice**.

## 1. Easy maintenance and optional `new`

With `vanilla` there are 3 points of maintenance if you add an argument:

```js
function VanillaPerson(name, surname, email) { // change

  // make `new` optional
  if (!(this instanceof VanillaPerson)) {
    return new VanillaPerson(name, surname, email); // change
  }

  this.name = name;
  this.surname = surname;
  this.email = email; // change
}
```

With `1-arity` there is a single point of maintenance if you add an argument:


```js
function Person(obj) { // no change

  if (!(this instanceof Person)) {
    return new Person(obj); // no change
  }

  this.name = obj.name;
  this.surname = obj.surname;
  this.email = obj.email; // change
}
```

## 2. Named parameters

JavaScript hasn't named parameters:

```js
// first argument is name or surname? I don't remember
var person = new VanillaPerson('Canti', 'Giulio'); // wrong!
```

`1-arity` is more verbose, but code is read more than written:

```js
// order doesn't matter and it's more readable
var person = new Person({surname: 'Canti', name: 'Giulio'});
```

## 3. Better management of optional parameters

With `vanilla`, handling optional arguments can be ugly and error prone:

```js
function VanillaPerson(name, surname, email, vat, address) {
  this.name = name;
  this.surname = surname;
  this.email = email;
  this.vat = vat;
  this.address = address;
}

// I must count the arguments to know where to put 'myaddress'
var person = new VanillaPerson('Giulio', 'Canti', null, 'myaddress'); // wrong!
```

With `1-arity` it's easy:

```js
var person = new Person({surname: 'Canti', name: 'Giulio', address: 'myaddress'});
```

## 4. JSON deserialization for free

Say you have a JSON of a person served by a JSON API:

```json
{
  "name": "Giulio",
  "surname": "Canti"
}
```

With `vanilla` you must implement (and maintain) a custom deserializer:

```js
function deserialize(x) {
  return new VanillaPerson(x.name, x.surname);
}

var person = deserialize(json);
```

Since in `1-arity` arguments and instances have the same shape, you get
deserialization for free. 

```js
var person = Person(json);
```

## 5. Idempotency

In math a function `f` is idempotent if `f(f(x)) = f(x)`.

`vanilla` is not idempotent, but it's easy to make `1-arity` idempotent:

```js
function Person(obj) {

  if (obj instanceof Person) {
    return obj;
  }

  ...
}

var person = Person({name: 'Giulio', surname: 'Canti'});
Person(person) === person; // => true
```

## 6. Avoid boilerplate

If you are a Domain Driven Design guy, you struggle with the verbosity of defining
all your classes, but with the `1-arity` pattern you can avoid the boilerplate with a simple function like this:

```js
function struct(props) {
  
  function Struct(obj) {

    // make Struct idempotent
    if (obj instanceof Struct) return obj;

    // make `new` optional
    if (!(this instanceof Struct)) return new Struct(obj);

    // add props
    var name;
    for ( var i = 0, len = props.length ; i < len ; i++ ) {
      name = props[i];
      // here you could implement type checking..
      this[name] = obj[name];
    }

  }

  return Struct;

}

// one liner, defines a 1-arity Person class
var Person = struct(['name', 'surname']);

var person = new Person({surname: 'Canti', name: 'Giulio'});
```

## Implementation

I used this pattern to implement [tcomb](https://github.com/gcanti). 

tcomb is a library for Node.js and the browser which allows you to **check the types** of 
JavaScript values at runtime with a simple syntax. It's great for **Domain Driven Design**, 
for testing and for adding safety to your internal code. 

