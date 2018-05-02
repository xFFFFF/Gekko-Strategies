var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.x3nikiehihsa;

// x3nikiehihsa by kuzetsa, 2014 June 29
var method = {};

// prepare everything our method needs
method.init = function() {

  this.name = 'x3nikiehihsa';

  this.trend = {
    direction: 'none',
    duration: 0
  };

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = config.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('x3nikiehihsa', 'x3nikiehihsa', settings);

};

// what happens on every new candle?
method.update = function(candle) {
  // NOTHING!!!
  // (just kidding, OOP takes care of it)
};

method.log = function() {
  var digits = 8;
  var x3nikiehihsa = this.indicators.x3nikiehihsa;

  log.info('\t', '[shortEMA]CLOSE:', x3nikiehihsa.shortC.result.toFixed(digits));
  log.info('\t', '[longEMA]CLOSE:', x3nikiehihsa.longC.result.toFixed(digits));
  log.info('\t', 'macd:', x3nikiehihsa.diff.toFixed(digits));
  log.info('\t', 'signal:', x3nikiehihsa.signal.result.toFixed(digits));
  log.info('\t', 'macdiff:', x3nikiehihsa.result.toFixed(digits));
};

method.check = function() {
  var x3nikiehihsa = this.indicators.x3nikiehihsa;

  var macddiff = x3nikiehihsa.result;
  // This is not a histogram...
  // it's more of an oscillator
  // and it's nearly identical to MACD
  // ... but it uses the entire candle

  if(macddiff > settings.thresholds.up) {

    // new trend detected
    if(this.trend.direction !== 'up') {
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        direction: 'up',
      };
    }

    this.trend.duration++;

    log.info('In uptrend since', this.trend.duration, 'candle(s)');

      this.advice('long');

  } else {

      this.trend = {
        duration: 0,
        direction: 'lizards',
      };

    this.advice('lizards');

  }
};

module.exports = method;
