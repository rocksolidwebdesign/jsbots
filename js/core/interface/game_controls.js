define([
  'core/dialogs'
], function(
  dialog
) {
  return {
    handleMouseMove: function(e) {
      this.game.mouseX = e.offsetX;
      this.game.mouseY = e.offsetY;
    },

    handleRunToggle: function(e) {
      e.preventDefault();

      if (this.isRunning) {
        this.stopLoop();
      } else {
        this.startLoop();
      }
    },

    startLoop: function() {
      if ($('.js-feature:checked').length <= 0 || $('.js-layer-def').length <= 0) {
        dialog.error('Please check some input features and add some hidden layers.');
        return;
      }

      this.isRunning = true;
      if (this.game && typeof this.game.run === 'function') {
        this.game.run();
      }
    },

    stopLoop: function() {
      this.isRunning = null;

      if (this.game && typeof this.game.stop === 'function') {
        this.game.stop();
      }
    },

    handleRetry: function(e) {
      e.preventDefault();

      this.stopLoop();
      this.game.retry();
      this.game.renderBotsList();
      this.startLoop();
    },

    handleEvolve: function(e) {
      e.preventDefault();

      this.stopLoop();
      this.game.evolve();
      this.game.renderBotsList();
      this.startLoop();
    }
  };
});
