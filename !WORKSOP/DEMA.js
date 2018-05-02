// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.DEMA;

// let's create our own method
var method = {};

// teach our trading method events
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);


// prepare everything our method needs
method.init = function() {
  this.currentTrend;
  this.requiredHistory = config.tradingAdvisor.historySize;

  this.trend = {
    direction: 'undefined',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.historySize = config.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('dema', 'DEMA', settings);
}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  var dema = this.indicators.dema;

  log.debug('calculated DEMA properties for candle:');
  log.debug('\t', 'long ema:', dema.long.result.toFixed(8));
  log.debug('\t', 'short ema:', dema.short.result.toFixed(8));
  log.debug('\t diff:', dema.result.toFixed(5));
  log.debug('\t DEMA age:', dema.short.age, 'candles');
}

method.check = function() {

  var dema = this.indicators.dema;
  var diff = dema.result;
  var price = this.lastPrice;

  var message = '@ ' + price.toFixed(8) + ' (' + diff.toFixed(5) + ')';


  if (!settings.tradeOnStart && this.trend.direction === 'undefined' ) {
    // We just started the program and we don't have a trend, so set it and wait until next time.
    log.debug("Trade On Start Disabled and No Direction Defined.");    
    if (diff > settings.thresholds.up)
      this.trend.direction = 'up';
    else
      this.trend.direction = 'down';
    this.advice(); 
  } else if(diff > settings.thresholds.up) {

    // new trend detected
    if(this.trend.direction !== 'up')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In uptrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();
    
  } else if(diff < settings.thresholds.down) {

    // new trend detected
    if(this.trend.direction !== 'down')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= settings.thresholds.persistence)
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
    if ( settings.tradeAfterFlat ) {
      log.debug("We want to Trade After Flat - setting trend to none");
      this.trend = {
         direction: 'none',
         duration: 0,
         persisted: false,
         adviced: false
      };

    }

    this.advice();
  }
}

module.exports = method;
