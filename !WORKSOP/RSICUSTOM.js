/*

  RSI - cykedev 14/02/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.lastLongPrice = '0';
  this.oversold = false;
  this.name = 'RSICUSTOM';
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', this.settings);
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  var digits = 8;
  var rsi = this.indicators.rsi;

  log.debug('calculated RSI properties for candle:');
  log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
  log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function() {
  var HIGH = this.settings.thresholds.high;
  var LOWLIMIT = this.settings.thresholds.lowlimit;
  var LOW  =  this.settings.thresholds.low 
  var PROFIT = this.settings.thresholds.profit;
  var rsi  = this.indicators.rsi;
  var rsiVal = rsi.result;

  this.priceAtual = (this.lastLongPrice + (this.lastLongPrice * PROFIT) / 100 );
  if ( rsiVal < LOW ) { this.oversold = true; }

  if(rsiVal > this.settings.thresholds.high && this.candle.close > this.priceAtual) {

    // new trend detected
    if(this.trend.direction !== 'high')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'high',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In high since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;


    if(
        this.trend.persisted && 
        this.candle.close > this.priceAtual && 
        !this.trend.adviced 
      ) {
   
      this.trend.adviced = true;
      log.info("VENDE  RSI:" + rsiVal);
      this.advice('short');
    } else
      this.advice();

  } //else if(rsiVal < this.settings.thresholds.low) {
    else if(rsiVal >= LOW && rsiVal < LOWLIMIT  && this.oversold === true ){

    // new trend detected
    if(this.trend.direction !== 'low')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'low',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In low since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if( this.trend.persisted && !this.trend.adviced ) {
      this.trend.adviced = true;
      log.info("COMPRA RSI:" + rsiVal); 
      this.advice('long');
      this.lastLongPrice = this.candle.close;
      this.oversold = false;
    } else
      this.advice();
  } else {

    log.debug('In no trend');

    this.advice();
  }
}

module.exports = method;
