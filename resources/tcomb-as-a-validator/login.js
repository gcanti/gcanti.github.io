$(function () {
  var t = window.t;
  var subtype = t.subtype;
  var struct = t.struct;
  var Str = t.Str;

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

  $('form').on('submit', function (evt) {
    evt.preventDefault();
    var email = $('#email').val().trim();
    var password = $('#password').val().trim();
    try {
      new User({
        email: email, 
        password: password
      });
    } catch (e) {
      alert('Not valid');
    }
  });

});