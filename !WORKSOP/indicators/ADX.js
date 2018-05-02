// required indicators
var RMA = require('./RMA.js');

var Indicator = function(config) {
  this.input = 'candle';

  this.ADX = new RMA(config.ADXLength);
  this.ATR = new RMA(config.DILength);
  this.DIM = new RMA(config.DILength);
  this.DIP = new RMA(config.DILength);

  this.lastCandle = false;
}

Indicator.prototype.update = function(candle) {
  if(!this.lastCandle) this.lastCandle = candle;

  let up = candle.high - this.lastCandle.high;
  let down = -(candle.low - this.lastCandle.low);
  let plusDM = up > down && up > 0 ? up : 0;
  let minusDM = down > up && down > 0 ? down : 0;
  let tr = Math.max(candle.high - candle.low, Math.abs(candle.high - this.lastCandle.close), Math.abs(candle.low - this.lastCandle.close));
  let trur = this.ATR.update(tr);
  this.plus = 100 * this.DIP.update(plusDM) / (trur == 0 ? 1 : trur);
  this.minus = 100 * this.DIM.update(minusDM) / (trur == 0 ? 1 : trur);
  let sum = this.plus + this.minus;
  this.result = 100 * this.ADX.update(Math.abs(this.plus - this.minus) / (sum == 0 ? 1 : sum));

  this.lastCandle = candle;
}

module.exports = Indicator;
