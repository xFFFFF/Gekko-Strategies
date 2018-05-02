/*
  
  MACD + RSI- By Marcus Lopes
  Obs: Trend verificada somente para o MACD

  

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var macdSettings = config.MACD;
var rsiSettings = config.RSI;
var uoSettings = config.UO;
var tsiSettings = config.TSI;

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'MACD&RSI';
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = config.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('macd', 'MACD', macdSettings);
  this.addIndicator('rsi', 'RSI', rsiSettings);
  this.addIndicator('uo', 'UO', uoSettings);
  this.addIndicator('tsi', 'TSI', tsiSettings);
}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  var digits = 8;
  var macd = this.indicators.macd;
  var rsi = this.indicators.rsi;
  var uo = this.indicators.uo;
  var tsi = this.indicators.tsi;


  var diff = macd.diff;
  var signal = macd.signal.result;

  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'short:', macd.short.result.toFixed(digits));
  log.debug('\t', 'long:', macd.long.result.toFixed(digits));
  log.debug('\t', 'macd:', diff.toFixed(digits));
  log.debug('\t', 'signal:', signal.toFixed(digits));
  log.debug('\t', 'macdiff:', macd.result.toFixed(digits));
  log.debug('calculated RSI properties for candle:');
  log.debug('\t', 'rsi:', rsi.rsi.toFixed(digits));
  log.debug('\t', 'price:', candle.close.toFixed(digits));
  log.debug('calculated Ultimate Oscillator properties for candle:');
  log.debug('\t', 'UO:', uo.uo.toFixed(digits));
  log.debug('\t', 'price:', candle.close.toFixed(digits));
  log.debug('calculated TSI properties for candle:');
  log.debug('\t', 'tsi:', tsi.tsi.toFixed(digits));
  log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function() {
  var macddiff = this.indicators.macd.result;
  var rsi = this.indicators.rsi;
  var rsiVal = rsi.rsi;
  var uo = this.indicators.uo;
  var uoVal = uo.uo;
  var tsi = this.indicators.tsi;
  var tsiVal = tsi.tsi;

  if(macddiff > macdSettings.thresholds.up && 
    (rsiVal > rsiSettings.thresholds.high ) && 
    (uoVal > uoSettings.thresholds.high) &&
    (tsiVal > tsiSettings.thresholds.high)) {

    // new trend detected
    if(this.trend.direction !== 'up')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In uptrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= macdSettings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();

  } else if(macddiff < macdSettings.thresholds.down && 
            (rsiVal < rsiSettings.thresholds.low ) &&
             (uoVal < uoSettings.thresholds.low) &&
             (tsiVal < tsiSettings.thresholds.low)) {

    // new trend detected
    if(this.trend.direction !== 'down')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= macdSettings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    } else
      this.advice();

  } else {

    log.debug('In no trend');

    // we're not in an up nor in a downtrend
    // but for now we ignore sideways trends
    // 
    // read more @link:
    // 
    // https://github.com/askmike/gekko/issues/171

    // this.trend = {
    //   direction: 'none',
    //   duration: 0,
    //   persisted: false,
    //   adviced: false
    // };

    this.advice();
  }
}

module.exports = method;
