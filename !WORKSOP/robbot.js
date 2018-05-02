// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

var log = require('../core/log');

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.currentTrend = 'long';
  this.requiredHistory = this.tradingAdvisor.historySize;

  this.base       = 0;
  this.nextBase   = 0;

  this.startRise  = 0;
  this.stopRise   = 0;
  this.rise       = 0;
  this.startFall  = 0;
  this.stopFall   = 0;
  this.fall       = 0;
  this.rises      = [];
  this.falls      = [];

  this.bought     = false;

  this.updatedFall = false;
  this.updatedRise = false;

  this.bought     = false;

  this.toUpdate   = false;

  this.close = 0;
}

strat.getAverage = function(array) {
  if(array.length > 0) {
    const sum = array.reduce((a,b) => a+b);
    return sum / array.length;
  } else {
    return 0;
  }
}

strat.isRising = function(candle) {
  if(candle.open < candle.close) {
    return true;
  } else {
    return false;
  }
}


// What happens on every new candle?
strat.update = function(candle) {

  if(this.isRising(candle)) {

    if(!this.startRise || this.startRise > candle.open) {
      this.startRise = candle.open;
    }

    if(!this.stopRise || this.stopRise < candle.close) {
      this.stopRise = candle.close;
    }

    this.rise = this.stopRise - this.startRise;

    if(!this.updatedRise && this.rise > this.getAverage(this.rises)) {
      this.falls.push(this.fall);
      this.startFall = 0;
      this.stopFall = 0;
      this.updatedRise = true;
      this.updatedFall = false;

      if(!this.bought) {
        this.base = candle.close - this.rise;
      }
    }

    if(this.nextBase && candle.close > this.base) {
      this.base = this.nextBase;
      this.nextBase = 0;
    }

    this.toUpdate = true;

  } else {

    if(!this.startFall || this.startFall < candle.open) {
      this.startFall = candle.open;
    }

    if(!this.stopFall || this.stopFall > candle.close) {
      this.stopFall = candle.close;
    }

    this.fall = this.startFall - this.stopFall;

    if(!this.updatedFall && this.fall > this.getAverage(this.falls)) {
      this.rises.push(this.rise);
      this.startRise = 0;
      this.stopRise = 0;
      this.updatedFall = true;
      this.updatedRise = false;

    }

    if(this.fall > this.getAverage(this.falls)) {
      this.toUpdate = true;
    } else {
      this.toUpdate = false;
    }

    if(candle.close < this.base) {
      this.nextBase = candle.close;
    }

  }

  this.close = candle.close;

}

// For debugging purposes.
strat.log = function() {
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {

  // Only continue if we have a new update.
  if(!this.toUpdate)
    return;

    if(!this.bought && this.close < this.base - this.settings.profit) {
      this.advice('long'); // buy
      this.bought = true;
    }

    if(this.bought && this.close > this.base) {
      this.advice('short'); // sell
      this.bought = false;
    }

}

module.exports = strat;
