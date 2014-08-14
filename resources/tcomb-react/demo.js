$(function () {

  function append (component) {
    var s = React.renderComponentToString(component);
    $('#demo').append($(s));
  }

  var Button = tr.Button;

  var onClick = function () { console.log('onClick'); };
  append(Button({type: 'suc', onClick: onClick}, 'Hi!'));

});