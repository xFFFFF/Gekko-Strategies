// Credits for the indicator:
// Patrick Mulloy, 1994
// name x3EMA means: "triple EMA" AKA "TEMA"

// (3 * (x1EMA(x) - x1EMA(x1EMA(x)))) + x1EMA(x1EMA(x1EMA(x)
// easier readability:
// (3 * (EMA - EMAprime)) + EMADoublePrime


var x1EMA = require('./EMA.js');

var Indicator = function(weight) {
  this.EMA = new x1EMA(weight);
  this.EMAprime = new x1EMA(weight);
  this.EMADoublePrime = new x1EMA(weight);
  };

Indicator.prototype.update = function(weight) {
var EMA = 0.0;
var EMAprime = 0.0;
var EMADoublePrime = 0.0;

  this.EMA.update(weight);
  EMA = this.EMA.result;

  this.EMAprime.update(EMA);
  EMAprime = this.EMAprime.result;

  this.EMADoublePrime.update(EMAprime);
  EMADoublePrime = this.EMADoublePrime.result;

  this.result = (3 * (EMA - EMAprime)) + EMADoublePrime;
};

module.exports = Indicator;
