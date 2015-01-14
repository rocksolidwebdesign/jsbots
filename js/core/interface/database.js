define([
], function(
) {
  return {
    getFirebaseRef: function() {
      url = $('.js-db-url').val();
      if (!url) {
        return;
      }

      ref = new Firebase(url);

      return ref;
    }
  };
});
