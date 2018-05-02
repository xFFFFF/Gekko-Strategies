var _ = require('lodash');

var Indicator = function(length) {
  this.input = 'candle';
  this.length = length;
  this.value = 0;
  this.result = 0;
  this.hl2history = [];
}

Indicator.prototype.update = function(candle) {
  /*
    len = input(9, minval=1, title="Length")

    high_ = highest(hl2, len)
    low_ = lowest(hl2, len)

    round_(val) => val > .99 ? .999 : val < -.99 ? -.999 : val

    value = 0.0
    value := round_(.66 * ((hl2 - low_) / max(high_ - low_, .001) - .5) + .67 * nz(value[1]))

    fish1 = 0.0
    fish1 := .5 * log((1 + value) / max(1 - value, .001)) + .5 * nz(fish1[1])

    fish2 = fish1[1]
  */
  let hl2 = (candle.high+candle.low)/2;
  this.hl2history.push(hl2);
  if(_.size(this.hl2history) > this.length)
    this.hl2history.shift();
  let low = _.min(this.hl2history);
  let high = _.max(this.hl2history);

  this.value = this.round(.66 * ((hl2 - low) / Math.max(high - low, .001) - .5) + .67 * this.value);
  this.result = .5 * Math.log((1 + this.value) / Math.max(1 - this.value, .001)) + .5 * this.result;
}

//    calculation (based on tick/day):
//  EMA = Price(t) * k + EMA(y) * (1 – k)
//  t = today, y = yesterday, N = number of days in EMA, k = 2 / (N+1)
Indicator.prototype.round = function(value) {
  return value > .99 ? .999 : value < -.99 ? -.999 : value;
}

module.exports = Indicator;
