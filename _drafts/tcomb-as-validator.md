---
layout: post
title: tcomb.js as a validator
---

Always dreamed to entangle your domain models and the validation rules of the UI together?

{{ site.tcomb }}

### Model

Let's start with a simple example, a login form validation.
Everybody wants the model be the single source of truth.

 Let `User` be the model:

{% highlight javascript %}

// login.js

var Email = subtype(Str, function (s) {
  return s.indexOf('@') !== -1;
});

// a password is a string of at least 6 chars
var Password = subtype(Str, function (s) {
  return s.length >= 6;
});

var User = struct({
  email: Email,
  password: Password
});

{% endhighlight %}

### UI

And here a simple login form

{% highlight html %}

<!-- login.html -->

<script type="text/javascript" src="tcomb.js"></script>
<script type="text/javascript" src="login.js"></script>

<form role="form">
  <div class="form-group">
    <input type="text" id="email" placeholder="Email" class="form-control"/>
  </div>
  <div class="form-group">
    <input type="password" id="password" placeholder="Password" class="form-control"/>
  </div>
  <button class="btn btn-primary btn-block">Log in</button>
</form>

{% endhighlight %}

You can find the entire code of the article at [tcomb-validator]()

