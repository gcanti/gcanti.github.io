---
layout: post
title: "Understanding React reimplementing it Part 1: Views"
---

## Abstract

After this [thread](http://www.reddit.com/r/javascript/comments/2jav2q/is_there_any_good_standalone_implementation_of/) on Reddit I started a journey to understand what can be generalized and unified in the different implementations of a React-like library. The best way I know to understand a thing isn't just to learn how it works but **which problems** it's trying to solve and **why it's designed** like this. 

To abstract the design process, I'll present a minimal model and I'll add feature after feature trying to explain the design decisions and, when possible, pointing to the corresponding implementations in [React](http://facebook.github.io/react/), [Mitrhil](http://lhorie.github.io/mithril/) and [Mercury](https://github.com/Raynos/mercury).

What follows is *my own interpretation* of React, feel free to criticize and contribute.

## Roadmap

Roughly these are the steps I forsee:

- **Views**: this post
    - A bit of history
    - Implementing a virtual DOM
    - Implementing views
    - Isomorphic JavaScript
- **Controllers**: Part 2
    - Events
    - Writing and reading from the DOM
    - Apps as finite state machines
    - An unoptimized reimplementation with jQuery
- **Optimizations**: Part 3
    - Components
    - Private state
    - Methods
    - VDOM diffs and patches

## A bit of history

History is fundamental to understand why we have a particular artifact, libraries like React don't appear from the thin air:

> So, the history of React is that we had this awesome way of building front-end on PHP called [XHP]( http://codebeforethehorse.tumblr.com/post/3096387855/an-introduction-to-xhp). We had been using it very successfully on the server for a while and when you moved to JS you were left with bare DOM manipulation which was terrible.

> The idea of React was to port the XHP way of writing interfaces to JS. The three main characteristics are: 

> 1. syntax extension to write XML inside of JS 
2. components 
3. using JS to generate markup (and not a template language)

> The big question that needed to be answered was how do you deal with updates? On the server you just re-render the entire page so you don't have to deal with this. In React, the diff algorithm and lifecycle methods were invented.

> [@Vjeux](https://twitter.com/Vjeux)

So the roots of React dive into the **plain old request / response cycle** between client and server (further referred to as ReqRes).
Now I see why React can be easily rendered server side: it's not a plus or a second thought, server side rendering belongs to its DNA!

## Implementing a virtual DOM

Why? Here three major reasons:

- Performance
- Flexibility
- Testability

### Performance

Can be surprising but the history of React tells us that:

> [Performance] was more a requirement to be able to use it rather than something we did React for.

> [@Vjeux](https://twitter.com/Vjeux)

If you want a simple architecture like ReqRes **and** you have performance issues **then** it's a good idea to implement a diff algorithm:
`ReqRes + Perf => VDOM + diff`.

Let me rephrase: if you want a simple architecture like ReqRes and you have no performance issues then you could simply end up with the client equivalent of "re-render the entire page":  `innerHTML`.

So one goal among others of the React team was to bring the simple ReqRes architecture to the client, while diffing and patching is an (awesome) implementation detail (this explains my choice to put them in the "Optimizations" part). 

I had the same goal three years ago when in [madai](http://madai.com/consumer/us/home.html) I implemented the internal framework based on ReqRes and on an idea similar to [om](https://github.com/swannodette/om): a single point of mutability. At that time React wasn't there and since we had no performance issues I implemented the re-rendering with an `innerHTML` of the app root to keep things KISS-y. This series of posts is grounded on the experience of these three years.

### Flexibility

Even if you have no performance issues, a VDOM can be extremely useful. As a frontend library author I'd like to target as many frontend and css framework as possible, but it's very difficult to achieve this goal if my views output HTML. Even worse, the users of my library are tied to me (well some author might be happy with this lock-in). If they are not satisfied by the output, they must ask and wait for a change, or fork the library if it's open source. Conversely if I'd output VDOMs, they will be able to patch the output autonomously, customize styles, remove unnecessary nodes, and so on.

### Testability

I'd like to easily test my views in all circumstances and with simple tools (no more HTML please!). The simplest solution I can think of is:

- the view output is determined by a single immutable data structure representing its state
- the view output should be unit testable without messing around with DOM, HTML, PhantomJS...

Do you want to show to somebody how your app will be rendered in some particular circumstance? Take the proper view, inject the proper state and ...bang! the browser show you the result.

Did you write a form library and you must test the gazzilion of possible outputs? What about writing a test suite with only Node.js and `assert.deepEqual`?

## Virtual DOM definition

Let's design a virtual dom as a JSON DSL, here its minimal (in)formal type definition:

```js
type VDOM = Node | Array<Node> // a tree or a forest

type Nil = null | undefined

type Node = {
  tag: string
  attrs: Nil | {
    style:      Nil | object<string, any>,
    className:  Nil | object<string, boolean>,
    xmlns:      Nil | string, // namespaces
    ...
  },
  children: Nil | string | VDOM
}
```

**Note**. `tag` is a string since the browser actually allows any name, and Web Components will use this fact for people to write custom names. `className` is a dictionary `string -> boolean` since it's easy to patch and manage (like React `cx(className)`).

**Example:**

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

### VDOM compairison

All the implementations are similar:

**React (v0.12)**

- `tag` is named `type`
- `attrs` is named `props`
- `className` is a `string`
- `children` is merged in `props`

React calls a virtual node `ReactDOMElement` ([React Virtual DOM Terminology](https://gist.github.com/sebmarkbage/fcb1b6ab493b0c77d589)).

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

**Mithril (v0.1.22)**

- `className` is a `string`

**Mercury (v8.0.0)**

- `tag` is named `tagName`
- `attrs` is named `properties`
- `className` is a string
- namespaces are handled with an additional property `namespace`

## Implementing views

Let `Data` be the set of all the data structures, then a *view* is a [pure](http://en.wikipedia.org/wiki/Pure_function) function `view: Data -> VDOM`, that is a function accepting a state and returning a VDOM.

### Flexibility: views customization

An interesting property of such views is that they can be composed with any function, included other views. This means you can use the power of functional programming in the view world:

```js
// button: object -> VDOM (a view without styling, the output of my library)
function button(style) {
  return {
    tag: 'button',
    attrs: {className: style}
  };
}

// boostrap: string -> object (Bootstrap 3 style)
function bootstrap(type) {
  var style = {btn: true};
  style['btn-' + type] = true;
  return style;
}

// boostrap: string -> object (Pure css style)
function pure(type) {
  var style = {'pure-button': true};
  style['pure-button-' + type] = true;
  return style;
}

// bootstrapButton: string -> VDOM
var bootstrapButton = compose(button, bootstrap);
// pureButton: string -> VDOM
var pureButton = compose(button, pure);

console.log(bootstrapButton('primary'));
```

prints

```json
{
  "tag": "button",
  "attrs": {
    "className": {
      "btn": true,
      "btn-primary": true
    }
  }
}
```

You get flexibility without loss of control:

- rely on the expressiviness of JavaScript in order to define views instead of defining a separate template language 
- the output of a view is determined by its input

**Structure and function composition** are two building blocks of mathematics thus you can be sure this approach is well founded and battle tested for a few centuries.

### Tests

## Isomorphic JavaScript

**Disclaimer**: pedantic and theoric paragraph ahead.

Here why I don't like the words "isomorphic JavaScript":

> With Node.js, a fast, stable server-side JavaScript runtime, we can now make this dream a reality. By creating the appropriate abstractions, we can write our application logic such that it runs on both the server and the client — the definition of isomorphic JavaScript.

> ["Isomorphic JavaScript: The Future of Web Apps"](http://nerds.airbnb.com/isomorphic-javascript-future-web-apps/)

I don't see any isomorphism there, it just means reutilization of code.




