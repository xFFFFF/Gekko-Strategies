// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {
  
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false,
    flagHasShort: false

  };

  this.firstUpwardPriceDetected = 0;
  this.firstDownwardPriceDetected = 0;

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('macd', 'MACD', this.settings);

  
}

// What happens on every new candle?
strat.update = function(candle) {

  // Get a random number between 0 and 1.
  this.randomNumber = Math.random();

  // There is a 10% chance it is smaller than 0.1
  this.toUpdate = this.randomNumber < 0.1;
}

// for debugging purposes: log the last calculated
// EMAs and diff.
strat.log = function() {
  var digits = 8;
  var macd = this.indicators.macd;

  var diff = macd.diff;
  var signal = macd.signal.result;
  var deltaLift = macd.currentPrice - this.firstUpwardPriceDetected;
  var pctDeltaLift = deltaLift * 100 /  this.firstUpwardPriceDetected;
  //TODO: add MACD slope  
  // https://www.wealth-lab.com/Forum/Posts/Identify-the-price-at-which-the-slope-of-MACD-changes-its-sign-intra-bar-38478

  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'short:', macd.short.result.toFixed(digits));
  log.debug('\t', 'long:', macd.long.result.toFixed(digits));
  log.debug('\t', 'macd:', diff.toFixed(digits));
  log.debug('\t', 'signal:', signal.toFixed(digits));
  log.debug('\t', 'macdiff:', macd.result.toFixed(digits));
  log.debug('Historical:');
  log.debug('\t', 'current price:', macd.currentPrice.toFixed(digits));
  
  if(this.trend.direction == 'up'){
    deltaLift = macd.currentPrice - this.firstUpwardPriceDetected;
    pctDeltaLift = deltaLift * 100 /  this.firstUpwardPriceDetected;
    log.debug('\t', 'price when lift detected:', this.firstUpwardPriceDetected.toFixed(digits));
    log.debug('\t', 'delta (current - initial):', deltaLift.toFixed(digits));
    log.debug('\t', '% changed since detection:', pctDeltaLift.toFixed(digits));
  } else if(this.trend.direction == 'down'){
    deltaLift = macd.currentPrice - this.firstDownwardPriceDetected;
    pctDeltaLift = deltaLift * 100 /  this.firstDownwardPriceDetected;
    log.debug('\t', 'price when fall detected:', this.firstDownwardPriceDetected.toFixed(digits));
    log.debug('\t', 'delta (current - initial):', deltaLift.toFixed(digits));
    log.debug('\t', '% changed since detection:', pctDeltaLift.toFixed(digits));
  }

  //log.debug('calculated random number:');
  //log.debug('\t', this.randomNumber.toFixed(3));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {
/*
  // Only continue if we have a new update.
  if(!this.toUpdate)
    return;

  if(this.currentTrend === 'long') {

    // If it was long, set it to short
    this.currentTrend = 'short';
    this.advice('short');

  } else {

    // If it was short, set it to long
    this.currentTrend = 'long';
    this.advice('long');

  }
*/

  //TODO: Add variable for manual pausing on giving no advice
  //TODO: Add short after 8 upward candles, don't wait for trend to go down.  
  //      If short early, don't advise to go long until next cycle.  Therefore add flagDoNotLongUntilShort.
  //  Add percent increase to get before jumping, or 8 candles change number for speed

  //TODO: If we went long and bought, we want to short after we are profitable by x%.
  
  //TODO: IF YOU can't buy in 7 candles, cancel the order, wait for the next wave


  var macddiff = this.indicators.macd.result;

  if(macddiff > this.settings.thresholds.up) {

    // new trend detected
    if(this.trend.direction !== 'up')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false,
        flagHasShort: false
      };

    if(this.trend.duration == 0)
      this.firstUpwardPriceDetected = this.indicators.macd.currentPrice;

    this.trend.duration++;

    log.debug('In uptrend since', this.trend.duration, 'candle(s)');



    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else {
      if(!this.trend.flagHasShort && this.trend.adviced && this.trend.persisted && this.trend.duration > this.indicators.macd.maxCandleToRunSize && this.trend.direction == 'up'){
        log.debug('Lets short this shit early! ', this.trend.duration, 'candle(s)');
        this.advice('short');
        this.trend.flagHasShort = true;
      } else {
        this.advice();
      }
      
    }

  } else if(macddiff < this.settings.thresholds.down) {

    // new trend detected
    if(this.trend.direction !== 'down')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false,
        flagHasShort: false
      };

    if(this.trend.duration == 0)
      this.firstDownwardPriceDetected = this.indicators.macd.currentPrice;

    this.trend.duration++;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(!this.trend.flagHasShort &&this.trend.persisted && !this.trend.adviced) {
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

module.exports = strat;
