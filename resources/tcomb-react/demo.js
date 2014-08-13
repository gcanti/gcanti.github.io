$(function () {

  function append (component) {
    var s = React.renderComponentToString(component);
    $('#demo').append($(s));
  }

  var Button = tr.Button;

  append(Button({className: 'btn-success'}, 'Hi!'));

});