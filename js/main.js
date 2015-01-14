requirejs.config({
  baseUrl: 'js',
  paths: {
    vendor: '../vendor'
  }
});

var expiresOneYear = 60*60*24*365;

var logHistory = [];
var log = function(msg) {
  var $msg;

  $msg = '<div class="message">'+msg+'</div>';

  if (logHistory.length > 29) {
    logHistory.splice(logHistory.length-1,1);
  }

  logHistory.unshift($msg);

  $('.js-messages').html(logHistory.join(''));

  console.log(msg);
};

var clearLog = function() {
  logHistory = [];
  $('.js-messages').html('');
};

require([
  'core/interface'
], function(
  Interface
) {
  new Interface({
    'el': document.getElementById('app')
  });
});
