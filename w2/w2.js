// Source: https://github.com/xFFFFF/Gekko-Strategies
var math = require('mathjs');
var _ = require('lodash');
var log = require('../core/log.js');
var config = require ('../core/util.js').getConfig();
var RSI = require('./indicators/RSI.js');
var SMA = require('./indicators/SMA.js');
var rsi_high = 0;
var rsi_low = 0;
var strategy = {
  candleBuffer : [],
  candleBufferSize: config.tradingAdvisor.historySize,
  init: function() {
    rsi_high = this.settings.rsi_short;
    rsi_low = this.settings.rsi_long;
    this.name = 'w2'
    this.addIndicator('wvf', 'WVF', { pd: this.settings.pd, bbl: this.settings.bbl, mult: this.settings.mult, lb: this.settings.lb, ph: this.settings.ph } );
    this.addIndicator('rsi', 'RSI', { interval: this.settings.rsi_interval });
    this.RSIhistory = [];
    this.fastrsi = new SMA(this.settings.fastrsi);
    this.slowrsi = new SMA(this.settings.slowrsi);
    this.requiredHistory = this.tradingAdvisor.historySize;
  },
  update: function(candle) {
    this.candleBuffer.push(this.candle);
    while (this.candleBufferSize < this.candleBuffer.length) this.candleBuffer.shift();
    this.rsi = this.indicators.rsi.result;
    this.RSIhistory.push(this.rsi);
    if(_.size(this.RSIhistory) > this.interval) {
      this.RSIhistory.shift();
    }
    this.lowestRSI = _.min(this.RSIhistory);
    this.highestRSI = _.max(this.RSIhistory);
    this.stochRSI = ((this.rsi - this.lowestRSI) / (this.highestRSI - this.lowestRSI)) * 100;
    if (!isNaN(this.stochRSI)) {
      this.fastrsi.update(this.stochRSI);
    }
    if (!isNaN(this.fastrsi.result)) {
      this.slowrsi.update(this.fastrsi.result);
    }
  },
  check : function(candle) {
    var StochRSIsaysBUY = this.stochRSI < rsi_low;
    var StochRSIsaysSELL = this.stochRSI >= rsi_high;
    var wvf = this.indicators.wvf;
    if((wvf.isBottom && StochRSIsaysBUY)) {
      return this.advice('long');
    } 
    else if ((wvf.isBottom===false && StochRSIsaysSELL)) {
      return this.advice('short');
    }
  },
  end : function() {
  },
};
module.exports = strategy;
