define(function() {
  var calc;

  calc = {
    guid: function() {
      var s4 = function() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
      };

      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
             s4() + '-' + s4() + s4() + s4();
    },

    getRandomInt: function(min, max) {
      min = min || 1;
      max = max || 101;

      return Math.floor(Math.random() * (max - min)) + min;
    },

    distance: function(a, b) {
      var dx, dy, dist;

      dx = Math.pow(a.x - b.x, 2);
      dy = Math.pow(a.y - b.y, 2);

      dist = Math.sqrt(dx + dy);

      return dist;
    },

    slopeAngle: function(p1, p2) {
      var dx, dy;

      dx = p2.x - p1.x;
      dy = p2.y - p1.y;

      return Math.atan2(dy, dx) * (180 / Math.PI);
    },

    sigmoid: function(input) {
      var minusT, e, eToMinusT;

      e = Math.E;
      minusT = input * -1;
      eToMinusT = Math.pow(e, minusT);

      return 1 / (1 + eToMinusT);
    },

    crossover: function(x, y) {
      var len, cutpoint, left, right, dna;

      cutpoint = calc.getRandomInt(1, x.length-1);

      left = x.slice(0, cutpoint);
      right = y.slice(cutpoint);

      dna = _.flatten([left, right]);

      return dna;
    },

    mutateFloat: function(c, chance) {
      return c.map(function(x) {
        var roll;

        roll = Math.random();

        if (roll < chance) {
          return calc.mutateFloatValue(x);
        }

        return x;
      });
    },

    mutateFloatValue: function(x) {
      var scalar;

      scalar = Math.random();

      if (Math.random() < 0.5) {
        scalar += 1;
      }

      if (Math.random() < 0.5) {
        scalar = scalar * -1;
      }

      return x * scalar;
    },

    generateNetworkFromChromosome: function(numWeights, layerDefs, chromosome) {
      var network, x, c, i, numLayers, j, numNeurons, w;

      x = 0;
      network = [];

      // number of neurons in layer
      numLayers = layerDefs.length;

      // for each layer;
      for (i = 0; i < numLayers; i++) {
        network[i] = [];

        numNeurons = layerDefs[i];
        for (j = 0; j < numNeurons; j++) {
          network[i][j] = [];

          for (k = 0; k < numWeights+1; k++) {
            network[i][j][k] = chromosome[x];
            x++;
          }
        }

        numWeights = layerDefs[i];
      }

      return network;
    },

    generateNetwork: function(numWeights, layerDefs) {
      var network, c, i, numLayers, j, numNeurons, w;

      network = [];

      // number of neurons in layer
      numLayers = layerDefs.length;

      // for each layer;
      for (i = 0; i < numLayers; i++) {
        network[i] = [];

        numNeurons = layerDefs[i];
        for (j = 0; j < numNeurons; j++) {
          network[i][j] = [];

          for (k = 0; k < numWeights+1; k++) {
            w = Math.random();

            if (Math.random() > 0.5) {
              w = w * -1;
            }

            network[i][j][k] = w;
          }
        }

        numWeights = layerDefs[i];
      }

      return network;
    },

    networkOutput: function(input, network) {
      var numLayers, i, ilen, send;

      send = _.reduce(network, function(memo, layer) {
        return calc.networkLayerOutput(memo, layer);
      }, input);

      return send;
    },

    networkLayerOutput: function(inputs, neurons) {
      var biasedInputs;

      biasedInputs = _.flatten([-1, inputs]);

      return _(neurons).map(function(weights) {
        var pairs, results, output;

        pairs = _.zip(biasedInputs, weights);
        results = pairs.map(function(a) {
          var val, i, w;

          i = a[0];
          w = a[1];

          val = i * w;

          return val;
        });

        output = results.reduce(function(memo, x) {
          return memo + x;
        }, 0);

        return calc.sigmoid(1/output);
      });
    }
  };

  return calc;
});
