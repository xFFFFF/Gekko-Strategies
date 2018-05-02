// SCHAFF TREND CYCLE INDICATOR
// ported to Gekko from ProRealCode.com Indicator: https://www.prorealcode.com/prorealtime-indicators/schaff-trend-cycle2/
// 2018 rob2112

var _ = require('lodash');
// required indicators
var EMA = require('./EMA.js');

var Indicator = function(config) {
  this.input = 'price'
  this.result = false;
  this.TCLen = config.TCLen;
  this.Factor = config.Factor;
  this.MA1Len = config.MA1Len;
  this.MA2Len = config.MA2Len;
  this.MA1 = new EMA(this.MA1Len);
  this.MA2 = new EMA(this.MA2Len);
  this.XMAChistory = [];
  this.PFhistory = [];
  this.PF = 0;
  this.PFF = 0;
  this.prevPF = 0;
  this.prevPFF = 0;
}

Indicator.prototype.update = function(candle) {
  // macd
  this.MA1.update(candle);
  this.MA2.update(candle);
  this.XMAC = this.MA1.result - this.MA2.result;

  // macd stochastic
  this.XMAChistory.push(this.XMAC);

  if (_.size(this.XMAChistory) > this.TCLen)
    // remove oldest XMAC value
    this.XMAChistory.shift();
  this.Value1 = _.min(this.XMAChistory);
  this.Value2 = _.max(this.XMAChistory) - this.Value1;

  // %Fast K of macd
  if (this.Value2 > 0) this.Frac1 = ((this.XMAC - this.Value1) / this.Value2) * 100;
  else this.Value2 = this.prevValue2;

  // smoothed %Fast D of macd
  this.PF = this.prevPF + this.Factor * (this.Frac1 - this.prevPF);

  // %Fast D stochastic
  this.PFhistory.push(this.PF);

  if (_.size(this.PFhistory) > this.TCLen)
    // remove oldest PF value
    this.PFhistory.shift();
  this.Value3 = _.min(this.PFhistory);
  this.Value4 = _.max(this.PFhistory) - this.Value3;

  // %Fast K of PF
  if (this.Value4 > 0) this.Frac2 = ((this.PF - this.Value3) / this.Value4) * 100;
  else this.Value4 = this.prevValue4;

  // smoothed %Fast D of PF
  this.PFF = this.prevPFF + this.Factor * (this.Frac2 - this.prevPFF);

  this.result = this.PFF;

  if (this.Value2) this.prevValue2 = this.Value2;
  if (this.Value4) this.prevValue4 = this.Value4;
  if (this.PF) this.prevPF = this.PF;
  if (this.PFF) this.prevPFF = this.PFF;

}

module.exports = Indicator;