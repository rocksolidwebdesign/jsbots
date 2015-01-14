define([
  'text!templates/bot_details.html',
  'core/target',
  'core/sweeper',
  'lib/rand',
  'lib/calc',
  'lib/draw'
], function(
  tplBotDetails,
  Target,
  Sweeper,
  rand,
  calc,
  draw
) {
  var flop = [1,0];

  var Game = function(options) {
    window.babaganouj = this;

    this.cidx = 0;
    this.t = 0;
    this.timeLimits = [];
    this.timeLimits.push(Number($('.js-game-time-limit').val()));

    this.eventLoop = null;
    this.generationNumber = 1;

    this.gameScore = null;
    this.targetIdNum = 0;
    this.botIdNum = 0;

    this.ui = options.ui;
    this.config = options.config;
    this.observer = options.observer;
    this.buffers = options.buffers;
    this.canvases = options.canvases;
    this.sprites = options.sprites;

    clearLog();

    if (options.config.startingPopulation) {
      this.bots = this.generateBotsFromPopulation(options.config.startingPopulation);
    } else {
      this.bots = this.generateBots();
    }

    this.targets = this.generateTargets();

    this.render();

    _(this.bots).each(function(b) {
      b.numTargetsFound = 0;
      b.distanceTraveled = 0;
      b.findings = [];
      b.distances = [];
      b.isTop = 0;
      b.isBest = 0;
    });

    this.render();
    this.renderBotsList();
  };

  Game.prototype.generateBotsFromPopulation = function(population) {
    var self;

    self = this;

    return _.map(population, function(b) {
      var s;

      s = self.createBot(b.chromosome);
      s.name = b.name;
      s.age = b.age;
      s.isAncestor = b.isAncestor;

      return s;
    });
  };

  Game.prototype.generateBots = function() {
    var list, qty;

    qty = this.config.numBots;

    list = _.range(0,qty);

    return _.map(list, this.generateBot.bind(this));
  };

  Game.prototype.generateBot = function(i) {
    return this.createBot();
  };

  Game.prototype.createBot = function(chromosome) {
    var s;

    s = new Sweeper({
      img: this.sprites.s,
      timeStepMs: this.config.timeStepMs,
      speedScale: this.config.speedScale,
      inputFields: this.config.inputFields,
      numInputs: this.config.numInputs,
      networkConfig: this.config.networkConfig,
      chromosome: chromosome
    });

    s.id = this.botIdNum++;

    this.positionBotRandomly(s);

    return s;
  };

  Game.prototype.positionBotRandomly = function(s) {
    var w, h, pad;

    pad = 30;
    w = Number(this.config.w);
    h = Number(this.config.h);

    s.lTrackSpeed = Math.random() * this.config.speedScale;
    s.rTrackSpeed = Math.random() * this.config.speedScale;

    s.x = rand.integer(0+pad,w-pad);
    s.y = rand.integer(0+pad,h-pad);

    log("Init robot x,y "+s.x+","+s.y+" L/R "+s.lTrackSpeed.toFixed(2)+"/"+s.rTrackSpeed.toFixed(2)+"");

    s.currentAngle = rand.integer(0,360);
  },

  Game.prototype.generateTargets = function() {
    var list, sprites, qty, i;

    sprites = this.sprites;
    qty = this.config.numTargets;

    ilen = qty;
    this.targets = [];
    for (i = 0; i < ilen; i++) {
      this.targets.push(this.generateTarget(i));
    }

    return this.targets;
  };

  Game.prototype.generateTarget = function(i) {
    var s, w, h, pad, numTries, maxTries, distances, smallestTargetDistance, smallestBotDistance;

    s = new Target(this.sprites.t0, this.sprites.t1);
    s.id = this.targetIdNum++;

    pad = 2;
    w = Number(this.config.w);
    h = Number(this.config.h);

    numTries = 0;
    maxTries = 1000;
    while (numTries < maxTries) {
      s.x = rand.integer(0+pad,w-pad);
      s.y = rand.integer(0+pad,h-pad);

      smallestBotDistance = _.min(_(this.bots).map(function(b) {
        return calc.distance(s, b);
      }));

      if (this.targets.length > 0) {
        smallestTargetDistance = _.min(_(this.targets).map(function(t) {
          return calc.distance(s, t);
        }));
      } else {
        smallestTargetDistance = 10000;
      }

      if (smallestBotDistance > 120 && smallestTargetDistance > 100) {
        break;
      }

      numTries++;
    }

    if (numTries >= maxTries) {
      console.log('BUGGER!');
    }

    return s;
  };

  Game.prototype.run = function() {
    var self, timeStep;

    if (this.eventLoop) {
      return;
    }

    timeStep = this.config.timeStepMs;

    self = this;
    this.eventLoop = setInterval(function() {
      self.t += timeStep;

      _.each(self.bots, function(b) {
        b.t += timeStep;
        b.findingTime += timeStep;
      });

      self.render();
    }, timeStep);

    this.scoreLoop = setInterval(function() {
      self.publishScores();
    }, 500);

    $('.js-run').html('<span class="glyphicon glyphicon-pause" aria-hidden="true"></span> Pause');
  };

  Game.prototype.stop = function() {
    if (!this.eventLoop) {
      return;
    }

    clearInterval(this.eventLoop);
    clearInterval(this.scoreLoop);
    this.eventLoop = null;
    this.scoreLoop = null;

    $('.js-run').html('<span class="glyphicon glyphicon-play" aria-hidden="true"></span> Play');
  };

  Game.prototype.ctx = function() {
    return this.buffers[this.cidx];
  };

  Game.prototype.blit = function() {
    this.canvases[flop[this.cidx]].style.display = 'none';
    this.canvases[this.cidx].style.display = 'block';

    this.cidx = flop[this.cidx];
  };

  Game.prototype.detectCollisions = function() {
    var targets, bots, ti, oldTargets;

    targets = this.targets;
    bots = this.bots;

    _(targets).each(function(t) {
      var isActive, b, i, ilen, dist, curTarget;

      isActive = false;

      ilen = bots.length;
      for (i = 0; i < ilen; i++) {
        b = bots[i];

        dist = calc.distance(t, b);

        curTarget = b.currentTarget(targets);
        if (dist < 18) {
          //if (curTarget && curTarget.id === t.id) {
            isActive = true;

            b.numTargetsFound += 1;
            b.findings.push(b.findingTime);
            b.distances.push(b.findingDistance);
            b.findingTime = 0;
            b.findingDistance = 0;

            break;
          //} else {
          //  log(b.name+" doesn't care about this target...");
          //}
        }
      }

      t.isActive = isActive;
    });

    newQty = _(targets).filter(function(t) {
      return t.isActive;
    }).length;

    if (newQty > 0) {
      this.publishScores();

      oldTargets = _(targets).filter(function(t) {
        return !t.isActive;
      });

      newTargets = _.range(0,newQty).map(this.generateTarget.bind(this));

      this.targets = _.flatten([oldTargets, newTargets]);
    }
  };

  Game.prototype.retry = function() {
    var self;

    self = this;

    this.t = 0;
    this.timeLimits.push(Number($('.js-game-time-limit').val()));

    this.gameScore = null;
    _.each(this.bots, function(b) {
      b.t = 0;
      b.findingTime = 0;
      b.findingDistance = 0;
      b.distanceTraveled = 0;
      b.numTargetsFound = 0;
      b.findings = [];
      b.distances = [];

      self.positionBotRandomly(b);
    });

    this.targets = this.generateTargets();

    this.render();

    _.each(this.bots, function(b) {
      b.t = 0;
      b.findingTime = 0;
      b.findingDistance = 0;
      b.distanceTraveled = 0;
      b.numTargetsFound = 0;
      b.findings = [];
      b.distances = [];
    });

    this.render();

    this.publishScores();
    $('.js-top-score').html('');
  };

  Game.prototype.evolve = function() {
    this.bots = this.generateEvolvedBots();
    this.targets = this.generateTargets();

    this.t = 0;
    this.timeLimits.push(Number($('.js-game-time-limit').val()));
    this.generationNumber += 1;
    this.gameScore = null;

    this.render();

    _.each(this.bots, function(b) {
      b.t = 0;
      b.findingTime = 0;
      b.findingDistance = 0;
      b.distanceTraveled = 0;
      b.numTargetsFound = 0;
      b.findings = [];
      b.distances = [];
    });

    this.t = 0;
    this.publishScores();
    $('.js-top-score').html('');
  };

  Game.prototype.generateEvolvedBots = function() {
    var bots, self, newBots, newBot, oldBot, a, b, self, i, ilen, unfit1, unfit2, toKeep, keptBots,
      population, population1, population2, fitChance, unfitChance,
      newCount, firstOrderCount, secondOrderCount, unfitCount, crossoverCount, mutationCount, reproductionCount;

    self = this;

    this.stop();

    newCount = 0;
    firstOrderCount = 0;
    secondOrderCount = 0;
    unfitCount = 0;
    reproductionCount = 0;

    newBots = [];
    fitChance = this.config.fitChance; // chance to come from the best performers, else, come from second best
    unfitChance = this.config.unfitChance; // individual chance to come from the worst performers
    newChance = this.config.newChance; // individual chance to come from the worst performers
    toKeep = this.config.numToKeep; // how many highest fitness members to keep from the previous generation

    // sort by fitness, highest to lowest
    bots = _.sortBy(this.bots, function(b) {
      return b.getFitness();
    }).reverse();

    population1 = [ bots[0], bots[1] ];
    population2 = [ bots[2], bots[3] ];
    unfit1 = bots[bots.length - 1];
    unfit2 = bots[bots.length - 2];

    ilen = this.config.numBots - toKeep;
    for (i = 0; i < ilen; i++) {
      if (i < (ilen * fitChance)) {
        firstOrderCount += 1;
        population = population1;
      } else {
        secondOrderCount += 1;
        population = population2;
      }

      if (Math.random() < 0.5) {
        a = population[0];
        b = population[1];
      } else {
        a = population[1];
        b = population[0];
      }

      if (Math.random() < unfitChance) {
        if (Math.random() < 0.5) {
          a = unfit1;
        } else {
          a = unfit2;
        }

        unfitCount += 1;
      }

      if (Math.random() < newChance) {
        newCount += 1;
        newBot = this.createBot();
      } else {
        reproductionStats = this.reproduce(a, b);
        newBot = reproductionStats.newBot;
        mutationCount += reproductionStats.mutationCount;
        crossoverCount += reproductionStats.crossoverCount;
        reproductionCount += 1;
      }

      newBot.numTargetsFound = 0;
      newBot.distanceTraveled = 0;

      newBots.push(newBot);
    }

    keptBots = bots.slice(0, toKeep).map(function(b) {
      self.positionBotRandomly(b);
      b.age += 1;
      b.isAncestor = true;
      b.numTargetsFound = 0;
      b.distanceTraveled = 0;
      b.findingTime = 0;
      b.findingDistance = 0;
      b.findings = [];
      b.distances = [];
      return b;
    });

    log("newCount");
    log(newCount);
    log("firstOrderCount");
    log(firstOrderCount);
    log("secondOrderCount");
    log(secondOrderCount);
    log("unfitCount");
    log(unfitCount);
    log("reproductionCount");
    log(reproductionCount);

    log("firstOrderCount+secondOrderCount");
    log(firstOrderCount+secondOrderCount);
    log("newCount+reproductionCount");
    log(newCount+reproductionCount);
    log("keptBots.length+newBots.length");
    log(keptBots.length+newBots.length);

    return _.flatten([keptBots, newBots]);
  };

  Game.prototype.reproduce = function(a, b) {
    var childDna, dna, x, y, population, randMember, crossoverCount, mutationCount;

    s = this.createBot();

    crossoverCount = 0;
    mutationCount = 0;
    if (Math.random() < this.config.crossoverChance) {
      console.log("performing crossover with "+a.name+" and "+b.name);

      x = a.getChromosome();
      y = b.getChromosome();

      childDna = calc.crossover(x, y);

      crossoverCount += 1;
    } else {
      population = [a, b];
      randMember = population[calc.getRandomInt(0,population.length)];

      console.log("creating mutation from "+randMember.name);

      dna = randMember.getChromosome();

      childDna = calc.mutateFloat(dna, this.config.geneMutationChance);

      mutationCount += 1;
    }

    if (childDna) {
      s.generateNetwork(childDna);
    }

    return {
      newBot: s,
      crossoverCount: crossoverCount,
      mutationCount: mutationCount
    };
  };

  Game.prototype.exportBots = function() {
    return _.map(this.bots, function(b) {
      return {
        name: b.name,
        age: b.age,
        isAncestor: b.isAncestor ? true : false,
        isTop: b.isTop ? true : false,
        isBest: b.isBest ? true : false,
        chromosome: b.getChromosome()
      }
    });
  };

  Game.prototype.updateBotTrajectories = function() {
    var bots, targets, fields, $checked;

    bots = this.bots;
    targets = this.targets;
    fields = this.config.inputFields;

    _(bots).each(function(b) {
      var c, dist, angle, v1, v2, inputs, inputVals, inputFields;

      v1 = [0, 0]; // bot heading vector
      v2 = [0, 0]; // bot to mine vector

      v1[0] = Math.sin(b.currentAngle);
      v1[1] = Math.cos(b.currentAngle);

      c = b.currentTarget(targets);

      v2[0] = c.x - b.x;
      v2[1] = c.y - b.y;

      dist = calc.distance(c, b);
      angle = calc.slopeAngle(c, b);

      inputVals = {
        'distance': dist,
        'nearest_coord': [c.x, c.y],
        'position': [b.x, b.y],
        'nearest_vector': v2,
        'speed': (b.lTrackSpeed + b.rTrackSpeed) / 2,
        'closing_speed': 0,
        'lspeed': b.lTrackSpeed,
        'rspeed': b.rTrackSpeed,
        'wheel_diff': b.lTrackSpeed - b.rTrackSpeed,
        'wheel_ratio': b.lTrackSpeed / b.rTrackSpeed,
        'heading': v1,
        'angle': b.currentAngle,
        'angle_diff': angle
      };

      inputFields = _(fields).map(function(fieldName) {
        return inputVals[fieldName];
      });

      inputs = _.flatten(inputFields);

      b.update(inputs);
    });
  };

  Game.prototype.publishClock = function() {
    var time, min, sec;

    time = this.t/1000;
    min = Math.floor(time/60);
    if (time > 60) {
      sec = time % 60;
    } else {
      sec = time;
    }

    sec = Math.floor(sec);

    $('.js-minutes').html(min+':'+(sec < 10 ? '0'+sec : sec)+'s');
  };

  Game.prototype.publishScores = function() {
    var topBots, bestBots, top, best, total, gameScore, timeLimit;

    total = _.reduce(this.bots, function(memo, b) {
      return memo + b.qty();
    }, 0);

    bestBots = _.sortBy(this.bots, function(b) {
      b.isTop = null;
      b.isBest = null;
      return b.fitness();
    }).reverse();

    timeLimit = this.timeLimits[this.timeLimits.length-1];
    if (!this.gameScore) {
      if ((((this.t+this.config.timeStepMs) / 1000 / 60) >= timeLimit)) {
        if ($('.js-is-real-game').is(':checked')) {
          this.stop();
        }

        gameScore = bestBots.slice(0,4).reduce(function(memo, b) {
          return memo + Number(b.fitness().toFixed(8));
        }, 0);

        $('.js-top-score').html(gameScore.toFixed(8));
        if (Number($('.js-high-score').html()) < gameScore.toFixed(8)) {
          $('.js-high-score').html(gameScore.toFixed(8))
          this.highScore = gameScore;
          this.whomper = gameScore;
        }
        this.yeppers = "whooodiddly";
        this.whammo = gameScore;
        this.hurr = this.timeLimits;
        this.gameScore = gameScore;
      }
    }

    best = bestBots[0];

    _.each(_.range(1,4), function(x) {
      if (bestBots[x].qty() > 0) {
        bestBots[x].isTop = true;
      }
    });

    if (best && best.qty() > 0) {
      $('.js-top-name').html(best.name);
      $('.js-top-bot').html(best.qty());
      best.isBest = true;
    } else {
      $('.js-top-name').html('');
      $('.js-top-bot').html('0');
    }

    $('.js-total-found').html(total);

    this.renderBotsList();

    $('.js-bot-info-display[data-id="'+best.id+'"]').addClass('winning-bot');

    $('.js-generation').html(this.generationNumber);
  },

  Game.prototype.renderBotsList = function() {
    var template, bots, html;

    template = Handlebars.compile(tplBotDetails);

    bots = _.sortBy(this.bots, function(b) {
      if (b.distance() > 0 && b.qty() > 0) {
        return b.fitness();
      } else {
        return b.fitness() + b.isAncestor ? 1 : 0;
      }
    }).reverse();

    html = _.map(bots, function(b) {
      var score, avgTime, avgDistance, chromosome;

      score = b.fitness().toFixed(8);
      chromosome = _.reduce(b.getChromosome(), function(memo, x) {
        if (x < 0) {
          return memo + ',' + x;
        } else {
          return memo + ', ' + x;
        }
      }, '').slice(1);

      avgTime = (b.avgFindTime()/1000).toFixed(4);
      avgDistance = (b.avgFindDistance()).toFixed(2);
      return template({
        id: b.id,
        icon: b.isAncestor ? '<span class="glyphicon glyphicon-tag"></span> ' : '',
        name: b.name,
        age: b.age,
        qty: b.qty(),
        avgTime: avgTime +'s',
        distance: avgDistance +'m',
        chromosome: chromosome,
        score: score < 0 ? '0.00' : score
      });
    }).join('');

    $('.js-bot-stats-list').empty();
    $('.js-bot-stats-list').html(html);
    $('.js-bot-stats-list').on('click', '.js-chromosome-display', function(e) {
      var $target;
      $target = $(e.currentTarget);
      $('.js-chromosome-output').text($target.data('chromosome').replace(/,/g, "\n"));
      $('.js-current-dna-name').text($target.data('name'));
    });
  },

  Game.prototype.render = function() {
    var ctx, w, h, botScores, isTele, time, min, sec, timeScore, best, totalFound;

    self = this;

    w = Number(this.config.w);
    h = Number(this.config.h);

    this.updateBotTrajectories();
    this.detectCollisions();

    _(this.bots).each(function(b) {
      b.move();
    });

    ctx = this.ctx();
    draw.clear(ctx);

    _(this.targets).each(function(t) {
      t.render(ctx);
    });

    _(this.bots).each(function(b) {
      var dist;

      dist = calc.distance(b, {x: self.mouseX, y: self.mouseY});

      b.showName = false;
      if (dist < 30) {
        b.showName = true;
      }

      b.render(ctx);
    });

    this.blit();
    this.publishClock();
  };

  return Game;
});
