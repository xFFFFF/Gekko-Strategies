// If you want to use your own trading methods you can
// write them here. For more information on everything you
// can use please refer to this document:
//
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md

var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config['talib-macd'];

// Let's create our own method
var method = {};

// Prepare everything our method needs
method.init = function() {
  this.name = 'talib-macd'
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = 'none';

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = config.tradingAdvisor.historySize;

  var customMACDSettings = settings.parameters;

  // define the indicators we need
  this.addTalibIndicator('mymacd', 'macd', customMACDSettings);
}

// What happens on every new candle?
method.update = function(candle) {
  // nothing!
}


method.log = function() {
  var digits = 8;
  var result = this.talibIndicators.mymacd.result;

  var diff = parseFloat(result['outMACD']);
  var signal = parseFloat(result['outMACDSignal']);
  var macddiff = diff - signal;

  log.debug('calculated Talib MACD properties for candle:');
  log.debug('\t', 'macd:', diff.toFixed(digits));
  log.debug('\t', 'signal:', signal.toFixed(digits));
  log.debug('\t', 'macdiff:', macddiff.toFixed(digits));
  log.debug('\t', 'trend:', this.trend);
}

// Based on the newly calculated
// information, check if we should
// update or not.
method.check = function() {
  var price = this.lastPrice;
  var result = this.talibIndicators.mymacd.result;
  var macddiff = result['outMACD'] - result['outMACDSignal'];

  if(settings.thresholds.down > macddiff && this.trend !== 'short') {
    this.trend = 'short';
    this.advice('short');

  } else if(settings.thresholds.up < macddiff && this.trend !== 'long'){
    this.trend = 'long';
    this.advice('long');

  }
}

module.exports = method;
