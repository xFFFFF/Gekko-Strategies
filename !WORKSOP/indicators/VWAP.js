// required indicators
// Simple Moving Average - O(1) implementation

var Indicator = function() {
  this.input = 'candle';
  this.result = 0;
  this.typicalPrice = 0;
  this.volume = 0;
}

Indicator.prototype.update = function(candle) {
  if(candle.start.utc().format('HH:mm:ss') === '00:00:00') {
    this.typicalPrice = 0;
    this.volume = 0;
  }
  this.typicalPrice += ((candle.high+candle.low+candle.close)/3) * candle.volume;
  this.volume += candle.volume;
  this.result = this.typicalPrice / this.volume;
}

module.exports = Indicator;
