define([
], function(
) {
  return {
    displayGameConfig: function() {
      var $inputs, $layers;

      $('.js-config-display-crossover-chance').html((this.gameConfig.crossoverChance * 100).toFixed(2));
      $('.js-config-display-gene-chance').html((this.gameConfig.geneMutationChance * 100).toFixed(2));
      $('.js-config-display-high-chance').html((this.gameConfig.fitChance * 100).toFixed(2));
      $('.js-config-display-low-chance').html((this.gameConfig.unfitChance * 100).toFixed(2));
      $('.js-config-display-new-chance').html((this.gameConfig.newChance * 100).toFixed(2));
      $('.js-config-display-keep-qty').html(this.gameConfig.numToKeep);

      $inputs = $('.js-inputs-list-config');
      $layers = $('.js-network-layers-config');

      $inputs.empty();
      _(this.gameConfig.inputFields).each(function(x) {
        $inputs.append('<li class="list-group-item">'+x+'</li>');
      });

      $layers.empty();
      $layers.append('<li class="list-group-item">'+this.gameConfig.numInputs+' Inputs </li>');
      var i = 0;
      _(this.gameConfig.networkConfig.slice(0,this.gameConfig.networkConfig.length-1)).each(function(x) {
        $layers.append('<li class="list-group-item">'+x+' Neurons </li>');
      });

      $layers.append('<li class="list-group-item">'+this.gameConfig.networkConfig[this.gameConfig.networkConfig.length-1]+' Outputs </li>');
    },

    displayScoreReset: function() {
      $('.js-best-bot').val('0');
      $('.js-minutes').val('0m0s');
      $('.js-generation').val('1');
    },

    displayGameBoardSize: function() {
      $('.js-canvas').attr('width', this.gameConfig.w);
      $('.js-canvas').attr('height', this.gameConfig.h);
      $('.js-canvas').css('width', this.gameConfig.w);
      $('.js-canvas').css('height', this.gameConfig.h);
    },

    displayShowConfig: function() {
      $('.js-new-game-settings').show();
      $('.js-run-game-screen').hide();

      $('.js-start').show();
      $('.js-run').hide();
      $('.js-evolve').hide();
      $('.js-reset').hide();
      $('.js-retry').hide();
      $('.js-save').parent('li').hide();
    },

    displayShowGame: function() {
      $('.js-new-game-settings').hide();
      $('.js-run-game-screen').show();

      $('.js-start').hide();
      $('.js-run').show();
      $('.js-evolve').show();
      $('.js-reset').show();
      $('.js-retry').show();
      $('.js-save').parent('li').show();
    },

    displayBotDetails: function() {
    }
  };
});
