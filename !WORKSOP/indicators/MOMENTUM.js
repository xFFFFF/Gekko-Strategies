// @link http://en.wikipedia.org/wiki/Exponential_moving_average#Exponential_moving_average

var Indicator = function(weight) {
  this.input = 'candle';
  this.weight = weight;
  this.result = false;
  this.age = 0;
}

Indicator.prototype.update = function(candle) {
  this.result = candle.low;
}

module.exports = Indicator;
