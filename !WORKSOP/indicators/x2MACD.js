// DEMA-based MACD by kuzetsa, 2014 June 26
var x2EMA = require('./x2EMA.js');

var Indicator = function(config) {
  this.diff = false;
  this.short = new x2EMA(config.short);
  this.long = new x2EMA(config.long);
  this.signal = new x2EMA(config.signal);
}

Indicator.prototype.update = function(price) {
  this.short.update(price);
  this.long.update(price);
  this.calculateEMAdiff();
  this.signal.update(this.diff);
  this.result = this.diff - this.signal.result;
}

Indicator.prototype.calculateEMAdiff = function() {
  var shortEMA = this.short.result;
  var longEMA = this.long.result;

  this.diff = shortEMA - longEMA;
}

module.exports = Indicator;
