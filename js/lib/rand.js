define(function() {
  return {
    integer: function(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }
  };
});
