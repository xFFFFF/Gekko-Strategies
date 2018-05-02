/*
  
  RSI - cykedev 14/02/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.A1RSI;

var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'A1-RSI';

  this.trend = {
    direction: 'none',
    duration: 0,
    bounces: 0,
    willBounce: false,
    persisted: false,
    adviced: false,
    flats: 0
  };

  this.requiredHistory = config.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', settings);
}

// for debugging purposes log the last 
// calculated parameters.
method.log = function(candle) {
  var digits = 8;
  var rsi = this.indicators.rsi;

  log.debug('calculated RSI properties for candle:');
  log.debug('\t', 'rsi:', rsi.rsi.toFixed(digits));
  log.debug('\t', 'price:', candle.close.toFixed(digits));
  log.debug('\t', 'volume:', candle.volume.toFixed(digits), 'trades:', candle.trades, 'vwp:', candle.vwp);
}

method.check = function(candle) {
  if (candle.trades == 0) {
    log.debug('No trades for candle, skipping strat check');
    return this.advice();
  }

  var rsi = this.indicators.rsi;
  var rsiVal = rsi.rsi;

  if(rsiVal > settings.thresholds.high) {

    // new trend detected
    if(this.trend.direction !== 'high')
      this.trend = {
        duration: 0,
        bounces: 0,
        willBounce: false,
        persisted: false,
        direction: 'high',
        adviced: false,
        flats: 0
      };

    this.trend.duration++;
    
    if (this.trend.willBounce) {
      this.trend.bounces++;
      this.trend.willBounce = false;
    }

    log.debug('In high since', this.trend.duration, 'candle(s)', 'bounce:', this.trend.bounces);


    //if (this.trend.duration >= settings.thresholds.persistenceHigh && rsiVal > settings.thresholds.high * settings.thresholds.highBypassRatio) this.trend.persisted = true;

    if(this.trend.duration >= settings.thresholds.persistenceHigh && this.trend.bounces >= (settings.thresholds.bouncesHigh || 0))
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    } else
      this.advice();
    
  } else if(rsiVal < settings.thresholds.low) {

    // new trend detected
    if(this.trend.direction !== 'low')
      this.trend = {
        duration: 0,
        bounces: 0,
        willBounce: false,
        persisted: false,
        direction: 'low',
        adviced: false,
        flats: 0
      };

    this.trend.duration++;

    if (this.trend.willBounce) {
      this.trend.bounces++;
      this.trend.willBounce = false;
    }

    log.debug('In low since', this.trend.duration, 'candle(s)', 'bounce:', this.trend.bounces);

    //if (this.trend.duration >= settings.thresholds.persistenceLow && rsiVal < settings.thresholds.low * settings.thresholds.lowBypassRatio) this.trend.persisted = true;

    if(this.trend.duration >= settings.thresholds.persistenceLow && this.trend.bounces >= (settings.thresholds.bouncesLow || 0))
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();

  } else {
    this.trend.duration = 0;
    this.trend.flats++;
    if (this.trend.flats >= settings.thresholds.resetNoTrend) {
      this.trend.bounces = 0;
      this.trend.flats = 0;
    }

    log.debug('In no trend');
    this.trend.willBounce = true;
    this.advice();
  }
}

module.exports = method;
