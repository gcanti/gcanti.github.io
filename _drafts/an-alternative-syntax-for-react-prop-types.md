---
layout: post
title: An alternative syntax for React propTypes
---

### Should I add propTypes to my components?

Definitely yes. Adding [propTypes](http://facebook.github.io/react/docs/reusable-components.html) to all the components improves development speed and documents the shape of the consumed data. After two months who can't even remember which property feeds which component?

But in order to become ubiquitous, the syntax used to express the constraints must
be simple and expressive, otherwise there is a big chance that laziness leads to undocumented and opaque components.

The tools provided by React are good, but when the domain models become more complex and you want express
fine-grained constraints you can hit a wall. An example is worth a thousand words: let's implement an imaginary ProductComponent.

### The Data

I want to feed my component with this props:

```javascript
//
// unless otherwise stated, all props are required
//

{
    name: 'iPod',

    // optional
    desc: 'Engineered for maximum funness.', 
    
    // a URL
    home: 'http://www.apple.com/ipod/', 
    
    // a list of shipping methods
    shippings: ['Same Day', 'Next Businness Day'], 
    
    // one of 'audio', 'video'
    category: 'audio', 
    
    // a number (dollars) or an object (another currency)
    price: {currency: 'EUR', amount: 100}, 
    
    // dimensions (width x height)
    dim: [2.4, 4.1] 
}
```

### Writing propTypes with the React tools

My bigger complaints are:

1. by default props are optionals, it can lead to subtle bugs
2. sometimes React issues cryptic warning messages
3. I can't express refinements without defining [custom props](http://facebook.github.io/react/docs/reusable-components.html)

```javascript
var r = require('react').PropTypes;

var categories = ['audio', 'video'];

var price = r.shape({
  currency: r.string.isRequired,
  amount:   r.number.isRequired // refinement?
}); 

var propTypes = {
  name:       r.string.isRequired,
  desc:       r.string,
  home:       r.string.isRequired, // refinement?
  shippings:  r.arrayOf(r.string.isRequired).isRequired,
  category:   r.oneOf(categories).isRequired,
  price:      r.oneOfType([r.number.isRequired, price.isRequired]).isRequired, // refinement?
  dim:        r.arrayOf(r.number.isRequired).isRequired // refinement?
};

var ProductComponent = React.createClass({
  propTypes: propTypes,
  render: function () {
    ...
  }
});
```
#### 1. by default props are optionals, it can lead to subtle bugs

in the first version of this example I forgot `r.number.isRequired` in

```javascript
  dim: r.arrayOf(r.number).isRequired
```
then I tried with `dim: [2.4, null]` and oviously got no warnings.

#### 2. sometimes React issues cryptic warning messages

Then I added `r.number.isRequired` and tried with the same data, got

    Warning: Required prop `1` was not specified in `ProductComponent`.

### Writing propTypes with the proposed syntax

```javascript
var t = require('tcomb');
var toPropTypes = require('tcomb-react-prop-types').toPropTypes;

var Category = t.enums.of('audio video');

var URL = t.subtype(t.Str, function (s) { return s.indexOf('http://') === 0; });

var Positive = t.subtype(t.Num, function (n) { return n >= 0; });

var Price = t.struct({ 
  currency: t.Str, 
  amount:   Positive // refinement
});

var Product = t.struct({
  name:       t.Str,                  
  desc:       t.maybe(t.Str), // optional, you must explicity opt-in
  home:       URL, // refinement
  shippings:  t.list(t.Str),       
  category:   Category,         
  price:      t.union([Positive, Price]), // refinement
  dim:        t.tuple([t.Num, t.Num]) // refinement 
});

var ProductComponent = React.createClass({

  propTypes: toPropTypes(Product),

  render: function () {
    ...
  }

});
```

### Comparison table

<table class="table">
  <thead>
    <th>Desc<th>
    <th>React<th>
    <th>Proposed syntax</th>
  </thead>
  <tbody>
    <tr>
      <td>optional prop<td>
      <td>A<td>
      <td>maybe(A)</td>
    </tr>
    <tr>
      <td>required prop<td>
      <td>A.isRequired<td>
      <td>A</td>
    </tr>
    <tr>
      <td>primitives<td>
      <td>
        array<br/>
        bool<br/>
        func<br/>
        number<br/>
        object<br/>
        string<br/>
        &#10008;<br/>
        &#10008;<br/>
        &#10008;<br/>
        &#10008;<br/>
      <td>
      <td>
        Arr<br/>
        Bool<br/>
        Func<br/>
        Num<br/>
        Obj<br/>
        Str<br/>
        Nil - <span class="text-muted">null, undefined</span><br/>
        Re - <span class="text-muted">RegExp</span><br/>
        Dat - <span class="text-muted">Date</span><br/>
        Err - <span class="text-muted">Error</span><br/>
      </td>
    </tr>
    <tr>
      <td>tuples<td>
      <td>&#10008;<td>
      <td>tuple(A, B)</td>
    </tr>
    <tr>
      <td>subtype<td>
      <td>&#10008;<td>
      <td>subtype(A, predicate)</td>
    </tr>
    <tr>
      <td>all<td>
      <td>any<td>
      <td>Any</td>
    </tr>
    <tr>
      <td>lists<td>
      <td>arrayOf(A)<td>
      <td>list(A)</td>
    </tr>
    <tr>
      <td>component<td>
      <td>component<td>
      <td>Component (*)</td>
    </tr>
    <tr>
      <td>instance<td>
      <td>instanceOf(A)<td>
      <td>A</td>
    </tr>
    <tr>
      <td>dictionary<td>
      <td>objectOf(A)<td>
      <td>Dict(A)</td>
    </tr>
    <tr>
      <td>enums<td>
      <td>oneOf(['a', 'b'])<td>
      <td>enums.of('a b')</td>
    </tr>
    <tr>
      <td>union<td>
      <td>oneOfType([A, B])<td>
      <td>union([A, B])</td>
    </tr>
    <tr>
      <td>renderable<td>
      <td>renderable<td>
      <td>Renderable (**)</td>
    </tr>
    <tr>
      <td>duck typing<td>
      <td>shape<td>
      <td>Shape (***)</td>
    </tr>
  </tbody>
</table>

- (*) Component = subtype(Any, ReactDescriptor.isValidDescriptor)
- (**) Renderable = subtype(Any, ...)
- (***) Shape = subtype(Any, ...)
