define([
  'core/dialogs',
  'core/game'
], function(
  dialog,
  Game
) {
  return {
    handleNewGame: function(e) {
      if (!confirm('Any evolutionary progress will be lost. Are you sure?')) {
        return;
      }

      this.stopLoop();
      this.displayShowConfig();
    },

    handleStartGame: function(e) {
      var gameConfig;

      e.preventDefault();

      gameConfig = this.getDomGameConfig();

      if (gameConfig) {
        this.initGame(gameConfig);
        this.startLoop();
      }
    },

    initGame: function(gameConfig) {
      this.gameConfig = gameConfig;

      this.runGame();
    },

    runGame: function() {
      this.displayGameBoardSize();
      this.displayGameConfig();
      this.createNewGame();
      this.displayShowGame();
    },

    handleResetGame: function(e) {
      if (!confirm('Any evolutionary progress will be lost. Are you sure?')) {
        return;
      }

      this.stopLoop();
      this.displayScoreReset();
      this.createNewGame();
      this.startLoop();
    },

    createNewGame: function() {
      this.game = new Game({
        ui: this,
        config: this.gameConfig,
        observer: this.observer,
        sprites: this.sprites,
        canvases: this.canvases,
        buffers: this.buffers
      });
    },

    getDomGameConfig: function() {
      if (
        $('.js-feature:checked').length <= 0 ||
        $('.js-layer-def').length <= 0
      ) {
        dialog.error('Please check some input features and add some hidden layers.');
        return;
      }

      return {
        chromosomes: null,

        timeStepMs: 32,

        w: Number($('.js-field-width').val() || 1024),
        h: Number($('.js-field-height').val() || 576),

        crossoverChance: Number($('.js-crossover-chance').val() || 50) / 100,
        geneMutationChance: Number($('.js-gene-mutation-chance').val() || 3.5) / 100,
        fitChance: Number($('.js-first-order-chance').val() || 75) / 100,
        unfitChance: Number($('.js-unfit-chance').val() || 33) / 100,
        newChance: Number($('.js-new-chance').val() || 10) / 100,
        numToKeep: Number($('.js-num-to-keep').val() || 2),

        numBots: Number($('.js-num-robots').val() || 25),
        numTargets: Number($('.js-num-targets').val() || 35),
        speedScale: Number($('.js-speed-scale').val() || 25),

        isTele: $('.js-teleport:checked').length > 0,

        numInputs: this.getNumInputs(),
        inputFields: this.getDomInputFields(),
        networkConfig: this.getNetworkConfig(this.getDomLayerDefs())
      }
    },

    getNumInputs: function() {
      var inputSizes, numInputs;

      // get the list of features chosen
      inputSizes = _.map($('.js-feature:checked'), function(el) {
        // some features imply more than one value, so
        // grab the data about number of values
        return Number($(el).data('size'));
      });

      // add together the number of values so we know
      // how many individual inputs will go into this network
      numInputs = _.reduce(inputSizes, function(memo, x) {
        return memo + x;
      }, 0);

      return numInputs;
    },

    getNetworkConfig: function(hiddenLayerDefs) {
      var hiddenLayerDefs, validLayerDefs, layerNeurons, layerDefs;

      // filter unusuable or non-sensical layers
      validLayerDefs = _.filter(hiddenLayerDefs, function(l) {
        return l;
      });

      // typecast to numbers
      layerNeurons = _.map(validLayerDefs, function(l) {
        return Number(l);
      });

      // add the two standard output neurons
      layerDefs = _.flatten([layerNeurons, [2]]);

      return layerDefs;
    },

    getDomInputFields: function() {
      var $checkedFeatures, inputFields;

      $checkedFeatures = $('.js-feature:checked');
      inputFields = _.map($checkedFeatures, function(el) {
        return $(el).data('field-name');
      });

      return inputFields;
    },

    getDomLayerDefs: function() {
      var $layerConfigInputs, layerDefs;

      $layerConfigInputs = $('.js-layer-def');
      layerDefs = _.map($layerConfigInputs, function(el) {
        return $(el).val();
      });

      return layerDefs;
    }
  };
});
