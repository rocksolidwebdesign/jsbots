define([
  'lib/cookie',
  'lib/calc'
], function(
  cookies,
  calc
) {
  return {
    handleUpdateDbCookie: function(e) {
      cookies.setItem('jsbotsDbUrl', $('.js-db-url').val(), expiresOneYear);
    },

    loadSessionDb: function(e) {
      if ($('.js-db-url').val().length <= 0 && cookies.getItem('jsbotsDbUrl')) {
        $('.js-db-url').val(cookies.getItem('jsbotsDbUrl'));
      }
    },

    setUserId: function() {
      var userId;

      userId = calc.guid();

      cookies.setItem('jsbotsAppUserId', userId, expiresOneYear);
    },

    getUserId: function() {
      if (!cookies.getItem('jsbotsAppUserId')) {
        this.setUserId();
      }

      return cookies.getItem('jsbotsAppUserId');
    }
  };
});

