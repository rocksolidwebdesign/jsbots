define([
  'core/interface/config_controls',
  'core/interface/database',
  'core/interface/game_controls',
  'core/interface/display_info',
  'core/interface/load',
  'core/interface/new_game',
  'core/interface/save',
  'core/interface/session',
], function(
  mixin_config_controls,
  mixin_database,
  mixin_game_controls,
  mixin_display_info,
  mixin_load,
  mixin_new_game,
  mixin_save,
  mixin_session
) {
  var Interface;

  var mixins = _.extend({},
    mixin_config_controls,
    mixin_database,
    mixin_game_controls,
    mixin_display_info,
    mixin_load,
    mixin_new_game,
    mixin_save,
    mixin_session
  );

  var definition = _.extend({}, mixins, {
    events: {
      'mousemove .js-canvas': 'handleMouseMove',
      'click .js-run': 'handleRunToggle',
      'click .js-start': 'handleStartGame',
      'click .js-new': 'handleNewGame',
      'click .js-reset': 'handleResetGame',
      'click .js-retry': 'handleRetry',
      'click .js-evolve': 'handleEvolve',
      'click .js-save': 'handleSaveGame',
      'click .js-load': 'handleLoadGame',
      'click .js-add-layer': 'handleAddLayer',
      'click .js-remove-layer': 'handleRemoveLayer',
      'click .js-feature': 'handleUpdateInputQty',
      'input .js-db-url': 'handleUpdateDbCookie'
    },

    initialize: function() {
      this.gameConfig = {};

      this.observer = new Backbone.Model();

      this.handleAddLayer(new Event('click'));
      this.userId = this.getUserId();
      this.loadSessionDb();

      this.sprites = {
        s: $('.js-img-sweeper')[0],
        t0: $('.js-img-t0')[0],
        t1: $('.js-img-t1')[0]
      };

      this.canvases = [
        $('.js-canvas0')[0],
        $('.js-canvas1')[0]
      ];

      this.buffers = [
        $('.js-canvas0')[0].getContext('2d'),
        $('.js-canvas1')[0].getContext('2d')
      ];
    }
  });

  Interface = Backbone.View.extend(definition);

  return Interface;
});
