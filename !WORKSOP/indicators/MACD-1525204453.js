// required indicators
var EMA = require('./EMA.js');

var Indicator = function(config) {
  this.diff = false;
  this.short = new EMA(config.short);
  this.long = new EMA(config.long);
  this.signal = new EMA(config.signal);
}

Indicator.prototype.update = function(price) {
  this.short.update(price);
  this.long.update(price);
  this.diff = this.short.result - this.long.result;
  this.signal.update(this.diff);
  this.result = this.diff - this.signal.result;
}

module.exports = Indicator;
