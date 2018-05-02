/*

  STC Demo Strategy based on Zschoros's calulations, adapted to an indicator
  RJPGriffin 4/2018

*/

// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();
var fs = require('fs');

var method = {};

method.init = function() {
  this.name = 'STC_Compare';
  this.resetTrend();
  this.startTime = new Date();

  config.backtest.batchSize = 1000; // increase performance
  config.silent = true; // NOTE: You may want to set this to 'false' @ live
  config.debug = true;

  this.prevStcVal = 0

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('stc', 'STC', this.settings.STC);
  this.addIndicator('stcz', 'STC_Rob', this.settings.STCR);
}

method.resetTrend = function() {
  var trend = {
    duration: 0,
    direction: 'none',
    longPos: false,
  };

  this.trend = trend;
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  // var digits = 2;
  // var stc = this.indicators.stc;
  //
  // log.debug('calculated RSI properties for candle:');
  // log.debug('\t', 'stc:', stc.result.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function(candle) {
  var stcVal = this.indicators.stc.result;
  var stczVal = this.indicators.stcz.result;
  thrHigh = this.settings.thresholds.high;
  thrLow = this.settings.thresholds.low;
  price = candle.close;

  fs.appendFile('ResultsLog/STC_Compare ' + this.startTime + '.csv', price + "," + stcVal + "," + stczVal + "\n", function(err) {
    if (err) {
      return console.log(err);
    }
  });


}

method.long = function() {
  if (this.trend.direction !== 'up') // new trend? (only act on new trends)
  {
    this.resetTrend();
    this.trend.direction = 'up';
    this.advice('long');
    if (this.debug) log.info('Going long');
  }

  if (this.debug) {
    this.trend.duration++;
    log.info('Long since', this.trend.duration, 'candle(s)');
  }
}


/* SHORT */
method.short = function() {
  // new trend? (else do things)
  if (this.trend.direction !== 'down') {
    this.resetTrend();
    this.trend.direction = 'down';
    this.advice('short');
    if (this.debug) log.info('Going short');
  }

  if (this.debug) {
    this.trend.duration++;
    log.info('Short since', this.trend.duration, 'candle(s)');
  }
}

module.exports = method;