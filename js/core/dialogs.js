define([
  'text!templates/error_dialog.html',
  'text!templates/success_dialog.html'
], function(
  tplErrorDialog,
  tplSuccessDialog
) {
  return {
    success: function(message, title) {
      var $modal, content, template;

      template = Handlebars.compile(tplSuccessDialog);

      $modal = $(template({
        message: message,
        title: title || 'Success'
      }));

      $modal.modal();
    },

    error: function(message, title, style) {
      var $modal, content, template;

      template = Handlebars.compile(tplErrorDialog);

      $modal = $(template({
        message: message,
        style: style || 'danger',
        title: title || 'Oops!'
      }));

      $modal.modal();
    }
  }
});
