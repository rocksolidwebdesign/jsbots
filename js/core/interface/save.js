define([
  'text!templates/save_game',
  'text!templates/saved_game_file',
  'core/dialogs'
], function(
  tplSaveGame,
  tplSaveFile,
  dialog
) {
  return {
    makeSavedGame: function(saveName) {
      var saveData;

      saveData = this;

      saveData = {
        userId: this.userId,
        title: saveName,
        createAt: Number(new Date()),
        gameConfig: _.extend(this.gameConfig, {
          generationNumber: this.game.generationNumber,
          startingPopulation: this.game.exportBots()
        })
      };

      return saveData;
    },

    renderSaveGameFiles: function(e) {
      this.fetchGames().done(function(data) {
        var gamesHtml, template;

        template = Handlebars.compile(tplSaveFile);

        if (data) {
          gamesHtml = _.map(data, function(game, key) {
            return template({
              id: key,
              name: game.title
            });
          }).join('');

          $('.modal .js-saved-games-list').html(gamesHtml);
        }
      });
    },

    handleSaveGame: function(e) {
      var url, self, $modal;

      e.preventDefault();

      self = this;

      this.stopLoop();

      $modal = $(tplSaveGame);
      $modal.modal();

      ref = this.getFirebaseRef();
      if (!ref) {
        dialog.error('No database provided. Please go back to the start screen and enter a Firebase URL.');
        return;
      }

      this.renderSaveGameFiles();

      $modal.on('click', '.js-saved-game-name', function(e) {
        var $target;

        if (!confirm('This will overwrite the previously saved game with this name.')) {
          return;
        }

        $target = $(e.currentTarget);
        $('.modal .js-save-name').val($target.text());
      });

      $modal.on('click', '.js-persist-save', function() {
        var saveName;

        saveName = $('.modal .js-save-name').val();
        if (!saveName) {
          dialog.error('Please enter a name for your saved game. "'+saveName+'" is not valid.');
          return;
        }

        self.checkOkToSave(saveName)
          .done(function() {
            var saveData;

            saveData = self.makeSavedGame(saveName);

            self.saveGame(saveData)
              .done(function() {
                $('.modal .js-save-name').val('');
                dialog.success('Your game was saved successfully.');
                self.renderSaveGameFiles();
              })
              .fail(function() {
                dialog.error('There was a problem trying to save your game. Please try again.');
              });
          });
      });
    },

    checkOkToSave: function(saveName) {
      var deferred;

      deferred = new $.Deferred();

      this.checkSaveExists(saveName)
        .done(function() {
          if (!confirm('This will overwrite the previously saved game with this name. Are you sure?')) {
            deferred.reject();
          } else {
            deferred.resolve();
          }
        })
        .fail(function() {
          deferred.resolve();
        });

      return deferred.promise();
    },

    checkSaveExists: function(saveName) {
      var deferred, ref;

      deferred = new $.Deferred();

      ref = this.getFirebaseRef();
      ref.child('games').child(saveName).once('value', function (data) {
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

    saveGame: function(saveData) {
      var deferred;

      deferred = new $.Deferred();

      ref = this.getFirebaseRef();
      ref.child('games').push(saveData, function(err) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });

      return deferred.promise();
    }
  };
});

