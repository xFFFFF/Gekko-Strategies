// required indicators
var SMA = require('./SMA.js');

var Indicator = function(length) {
  this.input = 'candle';
  this.result = 0;
  this.inner = new SMA(length);
  this.outer = new SMA(length);
}

Indicator.prototype.update = function(candle) {
  this.inner.update(candle.close * candle.volume);
  this.outer.update(candle.volume);
  this.result = this.inner.result / this.outer.result;
}

module.exports = Indicator;
