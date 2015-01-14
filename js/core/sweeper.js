define([
  'lib/calc',
  'lib/draw'
], function(
  calc,
  draw
) {
  var Sweeper = function(options) {
    this.t = 0;

    this.age = 1;

    this.lTrackSpeed = 0;
    this.rTrackSpeed = 0;

    this.numTargetsFound = 0;

    this.currentAngle = 0;
    this.currentSpeed = 0;
    this.maxFeetPerSecond = 5;

    this.pixelsPerFoot = 0.2;

    this.width = 30;
    this.height = 34;

    this.x = 50;
    this.y = 50;
    this.currentAngle = 0;
    this.distanceTraveled = 0;

    this.findingTime = 0;
    this.findingDistance = 0;
    this.findings = [];
    this.distances = [];

    this.img = options.img;
    this.timeStepMs = options.timeStepMs;
    this.speedScale = options.speedScale;
    this.inputFields = options.inputFields;
    this.numInputs = options.numInputs;
    this.networkConfig = options.networkConfig;

    this.generateNetwork(options.chromosome);

    this.name = faker.name.firstName();
  };

  Sweeper.prototype.getFitness = function() {
    return this.fitness();
  };

  Sweeper.prototype.distance = function() {
    return this.distanceTraveled;
  };

  Sweeper.prototype.qty = function() {
    return this.numTargetsFound;
  };

  Sweeper.prototype.avgFindDistance = function() {
    var avg, sum;

    avg = 0;

    if (this.distances.length > 0) {
      sum = _.reduce(this.distances, function(memo, x) {
        return memo + x;
      }, 0);

      avg = sum / this.distances.length;
    }

    return avg;
  };

  Sweeper.prototype.avgFindTime = function() {
    var avg, sum;

    avg = 0;

    if (this.findings.length > 0) {
      sum = _.reduce(this.findings, function(memo, x) {
        return memo + x;
      }, 0);

      avg = sum / this.findings.length;
    }

    return avg;
  };

  Sweeper.prototype.fitness = function() {
    var score, qty, distanceEfficiency, timeEfficiency, avgFindTime, avgFindDistance, value;

    qty = this.numTargetsFound
    avgFindTime = this.avgFindTime();
    avgFindDistance = this.avgFindDistance();

    distanceEfficiency = avgFindDistance > 0 ? (1/avgFindDistance) : 0;
    timeEfficiency = avgFindTime > 0 ? (1/avgFindTime) : 0;

    //score = qty + ((timeEfficiency*100)+(distanceEfficiency/100));
    score = qty + (timeEfficiency) + (distanceEfficiency/100);

    return score;
  };

  Sweeper.prototype.currentTarget = function(targets) {
    var a, b, aDist, bDist, existingTarget, curId;

    if (!this._currentTarget) {
      log(this.name + " needs a new target...");
      this._currentTarget = this.closest(targets);
      return this._currentTarget;
    }

    curId = this._currentTarget.id;
    existingTarget = _.find(targets, function(t) {
      return t.id === curId;
    });

    if (!existingTarget) {
      log(this.name + " lost the target...");
      this._currentTarget = this.closest(targets);
      return this._currentTarget;
    }

    a = this._currentTarget;
    b = this.closest(targets);

    if (a.id !== b.id) {
      aDist = calc.distance(this, a);
      bDist = calc.distance(this, b);

      if (bDist < (aDist*0.25)) {
        log(this.name + " sees a closer target...");
        this._currentTarget = b;
      }
    }

    return this._currentTarget;
  };

  Sweeper.prototype.getChromosome = function() {
    return _.flatten(this.network);
  };

  Sweeper.prototype.generateNetwork = function(chromosome) {
    if (chromosome) {
      this.network = calc.generateNetworkFromChromosome(this.numInputs, this.networkConfig, chromosome);
    } else {
      this.network = calc.generateNetwork(this.numInputs, this.networkConfig);
    }
  };

  Sweeper.prototype.closest = function(targets) {
    var self, sorted, distances;

    self = this;

    sorted = _.sortBy(targets, function(a) {
      return calc.distance(self, a);
    });

    return _.first(sorted);
  };

  Sweeper.prototype.update = function(inputs) {
    var self, outputs, neurons, layerDefs, layers, scale;

    outputs = calc.networkOutput(inputs, this.network);

    scale = this.speedScale;

    this.lTrackSpeed = outputs[0] * scale;
    this.rTrackSpeed = outputs[1] * scale;
  };

  Sweeper.prototype.turn = function(degrees) {
    var new_angle = this.currentAngle + degrees;

    if (new_angle > 360) {
      new_angle = new_angle - 360;
    } else if (new_angle < -360) {
      new_angle = new_angle + 360;
    }

    this.currentAngle = new_angle;
  };

  Sweeper.prototype.move = function() {
    //this.currentAngle += 0.5;

    //return;
    // The center of the tank  will probably be moving by the
    // average speed  of the  right and  left tracks.  At the
    // same time, the tank  will be rotating clockwise around
    // it's  center by  ([left track  speed] *  -[right track
    // speed]) / [width].

    // distance this tick = feet per time frame
    var tick_size = (this.timeStepMs/1000);
    //puts "Time Step #{tick_size} of a second"

    var delta_speed = this.lTrackSpeed - this.rTrackSpeed;
    var delta_speed_percent = delta_speed * this.maxFeetPerSecond;
    var real_delta_speed = delta_speed_percent * this.pixelsPerFoot;

    var angle_delta = real_delta_speed / this.width;
    angle_delta *= (tick_size * 60);

    //puts "Turning by #{angle_delta} degrees"

    this.turn(angle_delta);

    var speed_percent = ((this.lTrackSpeed + this.rTrackSpeed) / 2)/100;

    //puts "Average speed #{speed_percent*100}%"

    var real_distance = this.maxFeetPerSecond * speed_percent;
    //puts "Real Distance: #{real_distance} feet per second"

    var pixel_distance = this.pixelsPerFoot * real_distance;
    //puts "Pixel Distance: #{pixel_distance} pixels per second"

    var tick_distance = pixel_distance * tick_size;
    //puts "Tick Distance: #{tick_distance} pixels"

    var dx = Math.cos(this.currentAngle*Math.PI/180) * pixel_distance;
    var dy = Math.sin(this.currentAngle*Math.PI/180) * pixel_distance;

    this.x += dx;
    this.y += dy;

    var distanceMoved = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

    this.findingDistance += distanceMoved;
    this.distanceTraveled += distanceMoved;
  };

  Sweeper.prototype.render = function(ctx) {
    if (this.isBest) {
      ctx.shadowColor = "rgba(255,100,150,1)"; // string
      ctx.shadowOffsetX = 5; // integer
      ctx.shadowOffsetY = 5; // integer
      ctx.shadowBlur = 10; // integer
    } else if (this.isTop) {
      ctx.shadowColor = "rgba(100,255,100,1)"; // string
      ctx.shadowOffsetX = 2; // integer
      ctx.shadowOffsetY = 2; // integer
      ctx.shadowBlur = 7; // integer
    }

    draw.rotatedImage(ctx, this.img, this.x, this.y, this.currentAngle);

    ctx.shadowColor = "white"; // string
    ctx.shadowOffsetX = 1; // integer
    ctx.shadowOffsetY = 1; // integer
    ctx.shadowBlur = 5; // integer

    ctx.font = "bold 18px Courier New";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText(""+this.numTargetsFound, this.x, this.y+6, 34);

    ctx.shadowColor = "black"; // string
    ctx.shadowOffsetX = 1; // integer
    ctx.shadowOffsetY = 1; // integer
    ctx.shadowBlur = 5; // integer

    ctx.font = "12px Verdana";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(""+this.name, this.x+34, this.y-15);

    ctx.shadowColor = "rgba(0,0,0,0)"; // string
    ctx.shadowOffsetX = 0; // integer
    ctx.shadowOffsetY = 0; // integer
    ctx.shadowBlur = 0; // integer
  };

  return Sweeper;
});
