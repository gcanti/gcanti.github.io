---
layout: post
title: "Understanding React and reimplementing it from scratch Part 2: Controllers"
---

## Server side rendering and isomorphic views

In the previous article I called *universal view system* (UVS) the pair `(UVDOM, View)`. I can choose to implement UVS in another
programming language other then JavaScript, but then how I can connect them together? A mathematician would answer: find an isomorphism!

> In mathematics, an isomorphism is a structure-preserving mapping from one mathematical structure to another (and that admits an inverse).

That is, an isomorphism expresses the property: these two things are "equal" in some way.

Let `JavaScript` and `Ruby` two implementations of UVS and `f: JavaScript -> Ruby` a function such that `v(json) = f(v)(json)` for all `v` ∈ `JavaScript`, `json` ∈ `JSON` (that is `f` maps a function written in JavaScript to a function written in Ruby that performs the same computation on all the JSONs).

Obviously for now I must translate my JavaScript functions to Ruby by hand, but if we had a magic compiler that takes a JavaScript function in input and outputs a corresponding Ruby (or another language) function we had a way to express a view independent of the language (if anyone is interested to this project, let me know).

"Isomorphic JavaScript" is a trivial case of isomorphism where `f` is the identity function.


x

- `f(v ∙ w) = f(v) ∙ f(w)` for all `v`, `w` ∈ `JavaScript`

Let `∙` the symbol for function
composition, then the following properties hold:

- (Associativity) `(v ∙ w) ∙ z = v ∙ (w ∙ z)`
- (Identity element) `v ∙ id = id ∙ v = v`

UVS is thus a *monoid*, a type of algebric structure. 


## Manual management

```js
function view(state) {
  return {
    tag: 'button',
    children: state.text
  };
}

function App() {
  // rendering
  var vdom = view({text: 'Click me'});
  var dom = toHTML(vdom);
  $('#app').html(html);
}
```