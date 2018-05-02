// @link https://www.prorealcode.com/prorealtime-indicators/schaff-trend-cycle2/
// Adaptred by RJPGriffin - 12/4/18

var SMA = require('./SMA.js');

var Indicator = function(settings) {
  this.input = 'candle';
  this.indicates = 'volatility'; //info purpose
  this.result = false;
  this.age = 0;

  this.fastMA = new SMA(settings.Fast_MA);
  this.slowMA = new SMA(settings.Slow_MA);
  this.Cycle = settings.Cycle;

  this.macdArray = [];
  this.kMacd = false;
  this.dMacd = false;
  this.schaff = false;
}

Indicator.prototype.update = function(candle) {
  this.fastMA.update(candle.close);
  this.slowMA.update(candle.close);
  let macd = this.fastMA.result - this.slowMA.result;

  this.macdArray.push(macd);
  if (this.macdArray.length > this.Cycle) this.macdArray.shift();

  let macdHigh = Math.max(...this.macdArray);
  let macdLow = Math.min(...this.macdArray);

  //if (macdHigh > 0)
  this.kMacd = ((macd - macdLow) / (macdHigh - macdLow)) * 100;


  // for (let i = 0; i < this.macdArray.length; i++) {
  //   dMacd += this.macdArray[i];
  // }
  // dMacd = dMacd / this.macdArray.length;

  this.dMacd = this.macdArray.reduce(function(x, y) {
    return x + y;
  }) / this.macdArray.length;


  //if (dMacd != this.kMacd)
  this.schaff = 100 * (macd - this.kMacd) / (this.dMacd - this.kMacd);

  this.result = this.schaff;

  // console.log('In STC Indicator:');
  // console.log('Fast MA = ' + this.fastMA.result);
  // console.log('Slow MA = ' + this.slowMA.result);
  // console.log('macd = ' + macd);
  // console.log('macd Array Length = ' + this.macdArray.length);
  // console.log('macd High = ' + macdHigh);
  // console.log('macd Low = ' + macdLow);
  // console.log('kMacd = ' + this.kMacd);
  // console.log('dMacd = ' + this.dMacd);
  // console.log('STC Calculated in Indicator @ ' + this.result);

  this.age++;
  return this.result;
}

function getSum(total, num) {
  return total + num;
}

module.exports = Indicator;