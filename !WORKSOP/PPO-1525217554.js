/*
  
  PPO - cykedev 15/01/2014

  (updated a couple of times since, check git history)

  Modified by kuzetsa 2014 June 26 (CEXIO lizards variant)

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
  this.name = 'PPO';

  this.trend = {
   direction: 'none',
   duration: 0
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

  log.debug('calculated MACD properties for candle:');
  log.info('\t', 'short:', short.toFixed(digits));
  log.info('\t', 'long:', long.toFixed(digits));
  log.info('\t', 'macd:', macd.toFixed(digits));
  log.info('\t', 'macdsignal:', macdSignal.toFixed(digits));
  log.info('\t', 'machist:', (macd - macdSignal).toFixed(digits));
  log.info('\t', 'ppo:', result.toFixed(digits));
  log.info('\t', 'pposignal:', ppoSignal.toFixed(digits));
  log.info('\t', 'ppohist:', (result - ppoSignal).toFixed(digits));  
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
  var ppoHist = result - ppoSignal;

  if(ppoHist > settings.thresholds.up) {

    // new trend detected
    if(this.trend.direction !== 'up')
      this.trend = {
        duration: 0,
        direction: 'up'
      };

    this.trend.duration++;

    log.info('In uptrend since', this.trend.duration, 'candle(s)');

      this.advice('long');

    } else {

      this.trend = {
        duration: 0,
        direction: 'lizards'
      };


    this.advice('lizards');

  }

}

module.exports = method;
