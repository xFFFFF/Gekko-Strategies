var _ = require('lodash');
var SMA = require('./SMA');

var Indicator = function(config) {
  this.input = 'price';
  this.sma = new SMA(config.length);
  this.length = config.length;
  this.multi = config.multi;
  this.upper = 0;
  this.lower = 0;
  this.history = [];
}

Indicator.prototype.update = function(price) {
  /*
    basis = sma(src, length)
    dev = mult * stdev(src, length)
    upper = basis + dev
    lower = basis - dev
  */
  this.history.push(price);
  if(_.size(this.history) > this.length)
    this.history.shift();
  this.sma.update(price);
  let dev = this.multi * this.stddev(this.history);
  this.upper = this.sma.result + dev;
  this.lower = this.sma.result - dev;
}

Indicator.prototype.stddev = function(values) {
        const average = (data) => data.reduce((sum, value) => sum + value, 0) / data.length;

        const avg = average(values);
        const diffs = values.map((value) => value - avg);
        const squareDiffs = diffs.map((diff) => diff * diff);
        const avgSquareDiff = average(squareDiffs);
        return Math.sqrt(avgSquareDiff);
}

module.exports = Indicator;
