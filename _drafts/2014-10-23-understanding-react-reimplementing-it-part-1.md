---
layout: post
title: "Understanding React reimplementing it Part 1: VDOM (Draft)"
---

## Abstract

After this [thread](http://www.reddit.com/r/javascript/comments/2jav2q/is_there_any_good_standalone_implementation_of/) on Reddit I started
a journey to understand what can be generalized and unified in the different implementations of a React-like library.
The best way I know to understand a thing isn't to learn only how it works but **which problems** it's trying to solve and **why it's designed** like so. What follows is *my own interpretation* so feel free to disagree and criticize (in fact I'll be pleased to argue and improve my knowledge). I'll try to design an **abstract model** and I'll add notes when I think there is a corresponding implementation in [React](http://facebook.github.io/react/), [Mitrhil](http://lhorie.github.io/mithril/), [mercury](https://github.com/Raynos/mercury), etc...

## Roadmap

Roughly these are the stages I forsee:

- Views: this post
    - Implementing a virtual DOM (`ReactDOMElement`)
    - Implementing views (`render` method)
- Apps as finite state machines: Part 2
    - Tests
    - Views customization
    - Isomorphic JavaScript
- Controllers: Part 3 (`props`)
    - Events (`onClick`, `onChange`, ... )
    - Isomorphic JavaScript reprise
    - A simple library implementation with jQuery
    - todomvc
- Optimizations: Part 4
    - Components (`ReactClass`)
        - Reading from the DOM (`refs`)
        - Private state (`state`)
        - Methods
    - VDOM diffs and patches
    - Optimize todomvc

## Implementing a virtual DOM

Why? Here three major reasons:

- Performance
- Testability
- Flexibility

### Performance

Can be surprising but, for what I understand reading around, performance wasn't the main problem the React team wanted to solve.
One of the main goal of React was to achieve the **one-way data flow** in order to simplify the architecture, while diffing and patching is an (awesome!) implementation detail (hence I put it in the Optimization section). 

So was my goal three years ago when in [madai](http://madai.com/consumer/us/home.html) I implemented the internal framework based on an idea similar to [om](https://github.com/swannodette/om): a single point of mutability. At that time React wasn't there and since we had no performance problems I implemented the re-rendering with an `innerHTML` of the app root to keep things KISSy. This series of posts is grounded on the experience of these three years.

### Testability

I want to easily test my views in all circumstances and with simple tools (no more HTML please!). The simplest solution I can think is:

- the view output is determined by a single immutable data structure representing its state
- the view output should be unit testable without messing around with HTML, PhantomJS, Selenium...

Do you want to show to somebody how your app will be rendered in some particular circumstance? Take the proper view, inject the proper state and ...bang! the browser show you the result.

Did you write a form library and you must test the gazzilion of possible outputs? What about writing a test suite with only Node.js and `assert.deepEqual`?

### Flexibility

As a frontend library author I'd like to target as many frontend and css framework as possible, but it's very difficult to achieve this goal
if my views output HTML. Even worse, the users of my library are tied to me (well some author might be happy with this lock-in :). If they are not satisfied by the output, they must ask and wait for a change, or fork the library if it's open source. Conversely if I'd output VDOMs, they will be able to patch the output autonomously, customize styles, remove unnecessary nodes, and so on.

## VDOM Definition

Let's implement a virtual dom called **UVDOM** as JSON DSL, this is its minimal (in)formal type definition:

```js
type VDOM = Node | Array<Node> // a tree or a forest

type Nil = null | undefined

type Node = {
  tag: enum 'a', 'b', 'div', 'input', etc...,
  attrs: Nil  | {
    ...
    style: Nil | object<string, any>,
    // className is like React cx(className), it's easy to patch and manage
    className: Nil | object<string, boolean>
  },
  children: Nil | string | VDOM
}
```

Examples:

```js
// <a href="http://www.google.com">here</a>
var google = {
  tag: 'a',
  attrs: {href: 'http://www.google.com'},
  children: 'Google'
};

// <p class="lead"><span>Search on </span><a href="http://www.google.com">Google</a></p>
var paragraph = {
  tag: 'p',
  attrs: {className: {'lead': true}},
  children: [
    {
      tag: 'span',
      children: 'Search on '
    },
    google
  ]
};
```

## Compairison

All the other implementations are similar:

### React

- `tag` is named `type`
- `attrs` is named `props`
- `className` is a `string`
- `children` is merged in `props`

```js
// <a href="http://www.google.com">here</a>
var google = {
  type: 'a',
  props: {
    href: 'http://www.google.com',
    children: 'Google'
  }
};

// <p class="lead"><span>Search on </span><a href="http://www.google.com">Google</a></p>
var paragraph = {
  type: 'p',
  props: {
    className: 'lead'
    children: [
      {
        type: 'span',
        props: {
          children: 'Search on '
        }
      },
      google
    ]
  }
};
```

### Mithril

Quite the same as UVDOM, the only difference is:

- `className` is a `string`

### mercury

- `tag` is named `tagName`
- `attrs` is named `properties`
- `className` is a string (I think)
- there is an additional property `namespace` for SVG support

## Implementing views


