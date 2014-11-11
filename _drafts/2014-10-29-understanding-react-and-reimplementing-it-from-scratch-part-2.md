---
layout: post
title: "Understanding React and reimplementing it from scratch Part 2: Controllers (DRAFT)"
---

## Introduction

In the [previous article](TODO) I introduced the universal virtual DOM (UVDOM) and the concept of views as functions `view` such that `view: JSON -> VDOM`. 

```js
function view(state) {
  // <div><%= counter %><button>Click me!</button></div>
  return {
    tag: 'div',
    children: [
      state.counter,
      {
        tag: 'button',
        children: 'Click me!'
      }
    ]
  };
}
```

But this kind of view is "static", that is it's not able to react to user inputs. Since
in a browser user inputs are modeled as events, we need to add events and a way to handle them to views.

## Events

First of all we add the `events` section to `Node` type definition:

```js
type Node = {
  
  ...

  // events is a hash eventName -> eventHandler
  events: {
    click: function,
    change: function,
    ...
  }

}
```

But what about handlers? Views are isolated (`model` is an immutable JSON).
Let's introduce a communication system: a dictionary `object<string, function>` named *controller*.
Let `Controller` be the set of all the controllers, the view signature becomes: `view: JSON x Controller -> UVDOM`.

```js
function view(state, controller) {
  return {
    tag: 'div',
    children: [
      state.counter,
      {
        tag: 'button',
        children: 'Click me!'
        events: {
          click: controller.increment // outgoing message
        }
      }
    ]
  };
}
```

For convenience, if we accept the tradeoff to handle possible conflicts, we can merge model and controller to a single object obtaining again only one argument. At [madai](http://madai.com/consumer/us/home.html) we call these objects `sandboxes` (the name echoes our effort for testability). In React they are named `props`.

```js
function view(props) {
  return {
    tag: 'div',
    children: [
      props.counter,
      {
        tag: 'button',
        children: 'Click me!'
        events: {
          click: props.increment
        }
      }
    ]
  };
}
```

## View Lifecycle

This is the general lifecycle of a view:

**Mounting**

- create the HTML (optimizations like DOM diff will be discussed in the next article)
- retrieve the events
- insert HTML into the DOM
- attach the events to the DOM

**Unmounting**

- detach the events from the DOM
- remove the DocumentFragment from the DOM

But there is a problem with the attaching / detaching process: views output UVDOM trees and events can be deeply nested in the tree structure. How can I retrieve the events without losing the information about which node they are attached to? I need a deterministic way to traverse the tree and put an identifier (`data-id`) on its nodes. This is a simple algorithm:

- the root has `data-id = '.0'`
- if a node has `data-id = x` then its `i`-th child has `data-id = x + '.' + i`

Example:

```
root        .0
  node      .0.0
  node      .0.1
    node    .0.1.0
  node      .0.2
    node    .0.2.0
    node    .0.2.1
```

Now events can be linked to nodes with a hash `Hooks = object<data-id, object<eventName, eventHandler>>`: 

```
type Hook = {
  '.0': {
    click: handler,
    ...
  },
  ...
}
```

So we have these building blocks:

- `addHookId: UVDOM -> UVDOM`: add hooks to a UVDOM
- `toHTML: UVDOM -> string`: converts a UVDOM to HTML
- `toHooks: UVDOM -> Hooks`: converts a UVDOM to Hooks
- `attach: Hooks x Node -> IO DOM`: (side effects) delegates events to the mounting node
- `detach: Node -> IO DOM`: (side effects) removes the delegated events from the mounted node

## Server / Client side rendering

The previous build blocks can be grouped in three handy functions:

**Server side rendering** (React.renderToString)

```js
function renderToString(uvdom) {
  uvdom = addHookId(uvdom);         // add hook identifiers
  return toHTML(uvdom);             // render HTML
}
```

**Client side mounting** (React.render)

```js
function render(uvdom, node) {
  uvdom = addHookId(uvdom);         // add hook identifiers
  var hooks = toHooks(uvdom);       // retrieve hooks
  if (!node.innerHTML) {            // handle server side rendering
    node.innerHTML = toHTML(uvdom); // render HTML
  }
  attach(hooks, node);              // attach events to node
  node.hooks = hooks;               // store hooks for unmounting
}
```

**Client side unmounting** (React.unmountComponentAtNode)

```js
function unmountAtNode(node) {
  detach(node);
  node.innerHTML = '';
}
```

[Here](https://gist.github.com/gcanti/7dd8e887df62e6e1830a) you can find a gist with an actual implementation.

## Unmoved mover

This is the minimal reactive system I can think of:

```js
var node = document.getElementById('myapp');

(function transact(state) {
  unmountAtNode(node);
  var controller = {
    increment: function () {
      transact({counter: state.counter + 1});
    }
  };
  render(counter(state, controller), node);
})({counter: 0});
```

The state lives in the function argument.

## Apps as finite state machines

Now in order to have a reactive system I must handle this cycle:

```
state ---> render() ----> unmountAtNode() 
Ʌ                               |
|                               V
+--------- change state --------+
```

```js
function App(node, state) {
  this.node = node;
  this.transact(state);
  this.isMounted = true;
}

// state transition
App.prototype.transact = function (state) {
  this.state = state;
  if (this.isMounted) { // handle server side rendering
    unmountAtNode(this.node);
  }
  render(this.state.toUVDOM(this), this.node);
};
```

## A reimplementation with jQuery

## Digression: isomorphic view systems

Nothing said so far is strictly tied to JavaScript, hence I could choose to implement views with another programming language (say you have Ruby or Python on the server), but then how can I connect them cross-language? A mathematician would answer: find an isomorphism!

> In mathematics, an isomorphism is an invertible structure-preserving mapping from one mathematical structure to another.

That is, an isomorphism expresses the property: these two things are "equal" in some way.

Let `JavaScript` and `Ruby` two implementations of views and `f: JavaScript -> Ruby` a function such that `v(json) = f(v)(json)` for all `v` ∈ `JavaScript`, `json` ∈ `JSON` (that is `f` maps a function written in JavaScript to a function written in Ruby that performs the same computation on all the JSONs). 

Then `f` is a isomorphism between the `JavaScript` and `Ruby`monoids with respect to function composition.

As a consequence, if we had a compiler that takes a JavaScript function as input and outputs a corresponding Ruby function (or another programming language) we had a way to **express a view independent of the language**.

So "isomorphic JavaScript" is a trivial case of isomorphism where `f` is the identity function.

(If anyone is interested in writing such a compiler, go for it and let me know)

## Conclusion

This implementation works extraordinarily well for (TODO) LOC but there are some problems:

- no components
- the DOM is statefull
  - input focus and selection
  - scroll position
  - iframe
- performance

In the next article I'll talk about Components and optimizations.
