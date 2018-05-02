// required indicators
var SMA = require('./SMA.js');

var Indicator = function(config) {
  this.input = 'price';
  this.lastPrice = 0;
  this.short = new SMA(config.short);
  this.long = new SMA(config.long); 
  this.priceCount = 0; 
}

Indicator.prototype.update = function(price) {
  this.short.update(price);
  this.long.update(price);
  this.lastPrice = price;
  this.priceCount = this.priceCount + 1;
}

module.exports = Indicator;
