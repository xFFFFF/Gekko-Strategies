/*
  
  PPO - cykedev 15/01/2014

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log');

// configuration
var config = require('../core/util').getConfig();
var settings = config.PPO;

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
 this.trend = {
   direction: 'undefined',
   duration: 0,
   persisted: false,
   adviced: false
 };

  this.requiredHistory = config.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('ppo', 'PPO', settings);
}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
}

// for debugging purposes log the last 
// calculated parameters.
method.log = function() {
  var digits = 8;
  var ppo = this.indicators.ppo;
  var short = ppo.short.result;
  var long = ppo.long.result;
  var macd = ppo.macd;
  var result = ppo.ppo;
  var macdSignal = ppo.MACDsignal.result;
  var ppoSignal = ppo.PPOsignal.result;


  log.debug('calculated PPO properties for candle:');
  log.debug('\t', 'short:', short.toFixed(digits));
  log.debug('\t', 'long:', long.toFixed(digits));
  log.debug('\t', 'macd:', macd.toFixed(digits));
  log.debug('\t', 'macdsignal:', macdSignal.toFixed(digits));
  log.debug('\t', 'machist:', (macd - macdSignal).toFixed(digits));
  log.debug('\t', 'ppo:', result.toFixed(digits));
  log.debug('\t', 'pposignal:', ppoSignal.toFixed(digits));
  log.debug('\t', 'ppohist:', (result - ppoSignal).toFixed(digits));  
  log.debug('\t', 'Up Threshold:', settings.thresholds.up);
  log.debug('\t', 'Down Threshold:', settings.thresholds.down);  
}

method.check = function() {
  var price = this.lastPrice;

  var ppo = this.indicators.ppo;
  var long = ppo.long.result;
  var short = ppo.short.result;
  var macd = ppo.macd;
  var result = ppo.ppo;
  var macdSignal = ppo.MACDsignal.result;
  var ppoSignal = ppo.PPOsignal.result;

  // TODO: is this part of the indicator or not?
  // if it is it should move there
  var ppoHist = ppo - ppoSignal;

  
  if (!settings.tradeOnStart && this.trend.direction === 'undefined' ) {
    // We just started the program and we don't have a trend, so set it and wait until next time.
    if (ppoHist > settings.thresholds.up)
      this.trend.direction = 'up';
    else
      this.trend.direction = 'down';
    log.debug("Trade On Start Disabled and No Direction Defined. Setting direction to", this.trend.direction);
    this.advice(); 
  } else if(ppoHist > settings.thresholds.up) {
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
    
  } else if(ppoHist < settings.thresholds.down) {
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
