/*

  RU - 19 Nov 2017

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function () {

  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.currentTrend;
  this.requiredHistory = this.tradingAdvisor.historySize;

  this.age = 0;
  this.trade = {
    enabled: this.settings.stopLoss.enabled,
    openedPosition: false,
    stopLoss: 0,
    percents: this.settings.stopLoss.percents
  };

  this.trend = {
    direction: 'undefined',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.historySize = this.tradingAdvisor.historySize;
  this.ppoadv = 'none';
  this.uplevel = this.settings.thresholds.up;
  //this.uplevel = 160;
  this.downlevel = this.settings.thresholds.down;
  //this.downlevel = -30;
  this.persisted = this.settings.thresholds.persistence;
  //this.persisted = 0;

  // define the indicators we need
  this.addIndicator('emaFast', 'EMA', this.settings.EMA.fast);
  this.addIndicator('emaSlow', 'EMA', this.settings.EMA.slow);
  this.addIndicator('cci', 'CCI',
    {
      history: this.settings.CCI.history,
      constant: this.settings.CCI.constant
    });

}

// what happens on every new candle?
method.update = function (candle) {
  // nothing!
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function () {
  var digits = 8;
  var emaFast = this.indicators.emaFast.result;
  var emaSlow = this.indicators.emaSlow.result;

  log.debug('EMAs results');
  log.debug('\t', 'fast:', emaFast.toFixed(digits));
  log.debug('\t', 'slow:', emaSlow.toFixed(digits));
}

method.check = function (candle) {

  if (this.trade.enabled && this.trade.openedPosition) {
    if (this.trade.stopLoss > 0 && candle.close < this.trade.stopLoss) {
      this.advice('short');
      log.debug("StopLoss at: " + candle.close);
      this.trade.openedPosition = false;
      this.trade.stopLoss = 0;
      return;
    }
  }

  var cciResult = this.getCCI(candle);

  if (cciResult === null) {
    return;
  }

  if (cciResult === 'long' && this.getTrend() == "up") {
    this.advice("long");
    this.trade.openedPosition = true;
    this.trade.stopLoss = candle.close - (candle.close * (this.trade.percents / 100));
  }
  else if (cciResult === 'short' && this.getTrend() == "down") {
    this.advice("short");
    this.trade.openedPosition = false;
    this.trade.stopLoss = 0;
  }
}

method.getTrend = function () {
  var emaFast = this.indicators.emaFast.result;
  var emaSlow = this.indicators.emaSlow.result;

  if (emaSlow > emaFast && ((emaSlow - emaFast) > 2)) {
    log.debug("Uptrend");
    return "up"
  }
  else if (emaSlow < emaFast && ((emaFast - emaSlow) > 3)) {
    log.debug("Downtrend");
    return "down";
  }
}

method.getCCI = function (candle) {
  var price = candle.close;

  this.age++;
  var cci = this.indicators.cci;

  if (typeof (cci.result) == 'number') {

    // overbought?
    if (cci.result >= this.uplevel && (this.trend.persisted || this.persisted == 0) && !this.trend.adviced && this.trend.direction == 'overbought') {
      this.trend.adviced = true;
      this.trend.duration++;
      return 'short';
    } else if (cci.result >= this.uplevel && this.trend.direction != 'overbought') {
      this.trend.duration = 1;
      this.trend.direction = 'overbought';
      this.trend.persisted = false;
      this.trend.adviced = false;
      if (this.persisted == 0) {
        this.trend.adviced = true;
        return 'short';
      }
    } else if (cci.result >= this.uplevel) {
      this.trend.duration++;
      if (this.trend.duration >= this.persisted) {
        this.trend.persisted = true;
      }
    } else if (cci.result <= this.downlevel && (this.trend.persisted || this.persisted == 0) && !this.trend.adviced && this.trend.direction == 'oversold') {
      this.trend.adviced = true;
      this.trend.duration++;
      return 'long';
    } else if (cci.result <= this.downlevel && this.trend.direction != 'oversold') {
      this.trend.duration = 1;
      this.trend.direction = 'oversold';
      this.trend.persisted = false;
      this.trend.adviced = false;
      if (this.persisted == 0) {
        this.trend.adviced = true;
        return 'long';
      }
    } else if (cci.result <= this.downlevel) {
      this.trend.duration++;
      if (this.trend.duration >= this.persisted) {
        this.trend.persisted = true;
      }
    } else {
      if (this.trend.direction != 'nodirection') {
        this.trend = {
          direction: 'nodirection',
          duration: 0,
          persisted: false,
          adviced: false
        };
      } else {
        this.trend.duration++;
      }
      return null;
    }

  } else {
    return null;
  }

  log.debug("Trend: ", this.trend.direction, " for ", this.trend.duration);

}

module.exports = method;
