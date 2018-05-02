var _ = require('lodash');
var log = require('../core/log.js');

var method = {};

method.init = function() {
  this.name = 'Bestone';

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = this.settings.historySize || this.tradingAdvisor.historySize;

  this.RSIhigh = this.settings.thresholds.RSIhigh;
  this.RSIlow = this.settings.thresholds.RSIlow;
  this.MACDhigh = this.settings.thresholds.MACDhigh;
  this.MACDlow = this.settings.thresholds.MACDlow;
  this.persistance = this.settings.thresholds.persistance;

  const MACDSettings = this.settings.MACD;
  const EMAshortSettings = this.settings.EMAshort;
  const EMAlongSettings = this.settings.EMAlong;
  const STOCHSettings = this.settings.STOCH;
  const RSISettings = this.settings.RSI;

  this.addTulipIndicator('MACD', 'macd', MACDSettings);
  this.addTulipIndicator('EMAshort', 'ema', EMAshortSettings);
  this.addTulipIndicator('EMAlong', 'ema', EMAlongSettings);
  this.addTulipIndicator('RSI', 'rsi', RSISettings);
  this.addTulipIndicator('STOCH', 'stoch', STOCHSettings);
}

method.update = function(candle) {
  this.macd = this.tulipIndicators.MACD.result.macd;
  this.rsi = this.tulipIndicators.RSI.result.result;
  this.emashort = this.tulipIndicators.EMAshort.result.result;
  this.emalong = this.tulipIndicators.EMAlong.result.result;
  this.stochK = this.tulipIndicators.STOCH.result.stochK;
  this.stochD = this.tulipIndicators.STOCH.result.stochD;
}

method.log = function() {
  log.info(`
<==============================>
MACD: ${this.macd}
RSI: ${this.rsi}
EMA Short: ${this.emashort}
EMA LSong: ${this.emalong}
STOCH K: ${this.stochK}
STOCH D: ${this.stochD}
<===============================>
`);
}

method.check = function(candle) {
  if (this.emashort > this.emalong && this.stochK > this.stochD && this.macd > this.MACDhigh && this.rsi > this.RSIhigh) {
    if (this.trend.direction !== 'up') {
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };
    }

    this.trend.duration++;

    log.info('In uptrend since', this.trend.duration, 'candle (s)');

    if (this.trend.duration >= this.persistance) {
      this.trend.persisted = true;
    }

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else {
      this.advice();
    }
  } else if (this.emashort < this.emalong && this.stochK < this.stochD && this.macd < this.MACDlow && this.rsi < this.RSIlow) {
    if (this.trend.direction !== 'down') {
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };
    }

    this.trend.duration++;

    log.info('In downtrend since', this.trend.duration, 'candle (s)');

    if (this.trend.duration >= this.persistance) {
      this.trend.persisted = true;
    }

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    } else {
      this.advice();
    }
  } else {
    log.info('In no trend');
    this.advice();
  }
}

module.exports = method;