/*
  
  RSI - cykedev 14/02/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.RSI;

var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'RSI';

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = config.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', settings);
}

// for debugging purposes log the last 
// calculated parameters.
method.log = function() {
  var digits = 8;
  var rsi = this.indicators.rsi;

  log.debug('calculated RSI properties for candle:');
  log.debug('\t', 'rsi:', rsi.rsi.toFixed(digits));
  if(this.lastPrice)
    log.debug('\t', 'price:', this.lastPrice.toFixed(digits));
}

method.rsi_last = -1;

method.low_bounce_count = 0;
method.high_bounce_count = 0;

method.low_bounce_limit = 1;
method.high_bounce_limit = 1;

method.check = function() {
  var rsi = this.indicators.rsi;
  var rsiVal = rsi.rsi;

  // short is sell, long is buy
  
  if(rsiVal > settings.thresholds.high) {
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

    if(this.trend.duration >= settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      if (this.rsi_last != -1 && this.rsi_last > rsiVal) {
        this.high_bounce_count++;
      }
      if (this.high_bounce_count == this.high_bounce_limit) {
        this.trend.adviced = true;
        this.advice('short');
        this.high_bounce_count = 0;
        log.info('selling');
      }
    } else
      this.advice();
    
  } else if(rsiVal < settings.thresholds.low) {
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

    if(this.trend.duration >= settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {

      if (this.rsi_last != -1 && this.rsi_last < rsiVal) {
        this.low_bounce_count++;
      }

      if(this.low_bounce_count == this.low_bounce_limit) {
        this.trend.adviced = true;
        this.advice('long');
        this.low_bounce_count = 0;
        log.info('buying');
      }
        
    } else
      this.advice();

  } else {
    if(this.trend.persisted && !this.trend.adviced) {
      if(this.trend.direction == 'low') {
        this.trend.adviced = true;
        this.trend.duration = 0;
        this.advice('long');
        this.low_bounce_count = 0;
        log.info('in no trend but buy');
      } else if(this.trend.direction == 'high') {
        this.trend.adviced = true;
        this.trend.duration = 0;
        this.advice('short');
        this.high_bounce_count = 0;
        log.info('in no trend but sell');
      }
    } else {
      log.debug('In no trend');

      this.advice();
    }
  }

  log.info('rsi_last:' + this.rsi_last + ' - ' + 'rsiVal:' + rsiVal);

  this.rsi_last = rsiVal;
}

module.exports = method;
