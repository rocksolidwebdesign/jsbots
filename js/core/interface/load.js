define([
  'text!templates/load_game.html',
  'text!templates/saved_game_option.html',
  'core/dialogs'
], function(
  tplLoadGame,
  tplSavedGameOption,
  dialog
) {
  return {
    handleLoadGame: function(e) {
      var url, ref, savedGame, $modal, self;

      e.preventDefault();

      ref = this.getFirebaseRef();
      if (!ref) {
        dialog.error('No database provided. Please go back to the start screen and enter a Firebase URL.');
        return;
      }

      this.stopLoop();
      this.$existingSavesModal = null;
      $('.modal').modal('hide');
      $('.modal').remove();

      this.openSavedGames();
      this.fetchGames()
        .done(this.renderSavedGamesList.bind(this))
        .fail(function() {
          dialog.error('No saved games were found.');
        });
    },

    fetchGames: function() {
      var url, deferred;

      deferred = new $.Deferred();

      ref = this.getFirebaseRef();
      ref.child('games').on('value', function(data) {
        if (data.val()) {
          deferred.resolve(data.val());
        } else {
          deferred.reject();
        }
      }, function() {
        deferred.reject();
      });

      return deferred.promise();
    },

    renderSavedGamesList: function(data) {
      var template, list;

      this.savedGames = data;

      template = Handlebars.compile(tplSavedGameOption);

      list = _.map(data, function(val, key) {
        return template({
          'name': val.title,
          'id': key
        });
      }).join('');

      this.$savedGamesModal().find('.js-saved-games-list').html(list);
    },

    $savedGamesModal: function() {
      if (!this.$existingSavesModal) {
        this.$existingSavesModal = $(tplLoadGame);
        this.$existingSavesModal.on('click', '.js-saved-game-option', this.handleChooseSavedGame.bind(this));
      }

      return this.$existingSavesModal;
    },

    openSavedGames: function() {
      this.$savedGamesModal().modal('show');
    },

    handleChooseSavedGame: function(e) {
      var $target, id, gameConfig;

      $('.modal').modal('hide');
      $('.modal').remove();

      $target = $(e.currentTarget);
      id = $target.data('id');
      chosenGame = this.savedGames[id];

      if (!(chosenGame && typeof chosenGame === 'object' && typeof chosenGame.gameConfig === 'object')) {
        dialog.error('Sorry, we couldn\'t find that game.');
        return;
      };

      this.stopLoop();
      this.initGame(chosenGame.gameConfig);
      $('.js-generation').html(chosenGame.gameConfig.generationNumber);
      $('.js-top-score').html('0');
    }
  };
});

