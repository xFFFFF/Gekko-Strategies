// filename "DEMA.js" already in use by some old legacy code
// name x2EMA means: "double EMA" (usually called DEMA)
// (2 * x1EMA(x)) - x1EMA(x1EMA(x))

var x1EMA = require('./EMA.js');

var Indicator = function(weight) {
  this.EMA = new x1EMA(weight);
  this.EMAprime = new x1EMA(weight);
}

Indicator.prototype.update = function(weight) {
var EMA = 0.0;
  this.EMA.update(weight);
  EMA = this.EMA.result;
  this.EMAprime.update(EMA);
  this.result = (2 * EMA) - this.EMAprime.result;
}

module.exports = Indicator;
