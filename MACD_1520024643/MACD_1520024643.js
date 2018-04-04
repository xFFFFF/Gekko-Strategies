// Source: https://raw.githubusercontent.com/jazzbre/gekko/stable/strategies/MACD.js
// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies

/*

  MACD - DJM 31/12/2013

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function () {
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
  this.requiredHistory = this.tradingAdvisor.historySize;
  this.index = 0;

  this.prevCrossA = false;
  this.prevCrossB = false;

  this.tradeOpen = false;
  this.stop = 0;
  this.buyPrice = 0;

  // define the indicators we need
  this.addIndicator('macd', 'MACD', this.settings);
  this.addIndicator('rsi', 'RSI', this.settings);
  // Date; Time; Global_active_power; Global_reactive_power; Voltage; Global_intensity; Sub_metering_1; Sub_metering_2; Sub_metering_3
  // 16 / 12 / 2006; 17: 24: 00; 4.216; 0.418; 234.840; 18.400; 0.000; 1.000; 17.000  
}

// what happens on every new candle?
method.update = function (candle) {
  // nothing!
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function (candle) {
  var digits = 8;
  var macd = this.indicators.macd;

  var diff = macd.diff;
  var signal = macd.signal.result;

  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  if (this.index == 0) {
    // console.log('DateTime;Open;Close;Volume;RSI');
  }
  // console.log(candle.start.utc().format() + ';' + candle.open + ';' + candle.close + ';' + candle.volume + ';' + rsiVal);
  console.log(candle.close);
  /*
    log.debug('calculated MACD properties for candle:' + this.index);
    log.debug('\t', 'short:', macd.short.result.toFixed(digits));
    log.debug('\t', 'long:', macd.long.result.toFixed(digits));
    log.debug('\t', 'macd:', diff.toFixed(digits));
    log.debug('\t', 'signal:', signal.toFixed(digits));
    log.debug('\t', 'macdiff:', macd.result.toFixed(digits));
    */
  this.index++;
}

method.check = function (candle) {
  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  var macd = this.indicators.macd;
  var diff = macd.diff;
  var signal = macd.signal.result;

  // log.debug('macd1:' + diff + ' macd2:' + signal + ' rsi:' + rsiVal);

  var crossA = diff < signal && diff > 0 && signal > 0;
  var crossB = diff > signal && diff < 0 && signal < 0;

  var plot = candle.close;

  // Check sell
  if (this.tradeOpen) {
    // if ((crossA && !this.prevCrossA && diff > 0 && signal > 0) || candle.close < this.stop) {
    if (rsiVal > 65) { //} || candle.close < this.stop) {
      plot = crossA ? candle.close + candle.close * -0.1 : candle.close;
      this.advice("short");
      this.tradeOpen = false;
      // log.debug("Sell at:" + candle.close + " Diff:" + (candle.close - this.buyPrice) + " rsi:" + rsiVal);
    }
  }
  // Check buy
  else if (!this.tradeOpen) {
    // if (crossB && !this.prevCrossB && diff < 0 && signal < 0) {
    if (rsiVal < 25) {
      plot = crossB ? candle.close + candle.close * 0.1 : candle.close;
      this.advice("long");
      this.tradeOpen = true;
      this.stop = candle.close - (candle.close / 100.0) * 3.0;
      this.buyPrice = candle.close;
      // log.debug("But at:" + candle.close + " rsi:" + rsiVal);
    }
  }

  macd.result = plot;

  this.prevCrossA = crossA;
  this.prevCrossB = crossB;

  /*
  var macddiff = this.indicators.macd.result;
  var macdlol = this.indicators.macd.signal;

  if (macdlol > this.settings.thresholds.up) {

    // new trend detected
    if (this.trend.direction !== 'up')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In uptrend since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
      log.debug('Sell at:' + candle.close + ' macdlol:' + macdlol);
    } else
      this.advice();

  } else if (macdlol < this.settings.thresholds.down) {
    // new trend detected
    if (this.trend.direction !== 'down')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
      log.debug('Buy at:' + candle.close + ' macdlol:' + macdlol);
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
  */
}

module.exports = method;
