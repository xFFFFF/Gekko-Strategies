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
var stopLoseProcent = 1;
var profitPercent = 1;

// Prepare everything our method needs
strat.init = function() {
  this.input = 'candle';
  this.requiredHistory = this.tradingAdvisor.historySize;
  this.addIndicator('emab', 'EMA', 55);
  this.addIndicator('emas', 'EMA', 21);
}

strat.params = {
  position: 'short',
};

// What happens on every new candle?
strat.update = function(candle) {

  this.candle = candle;
  this.trend = this.indicators.emab.result > this.indicators.emas.result ? 'down' : 'up';
  this.tradezone = false;

  if (this.trend === 'down' && this.prevtrend === 'up') {
    // if (this.indicators.emab.result > this.indicators.emas.result) {
      this.tradezone = true;
    // }
  } else if (this.trend === 'up' && this.prevtrend === 'down') {
    // if (this.indicators.emab.result < this.indicators.emas.result) {
      this.tradezone = true;
    // }
  }

  this.prevtrend = this.trend;

}

// For debugging purposes.
strat.log = function() {
  // log.debug('calculated random number:');
  // log.debug('\t', this.randomNumber.toFixed(3));
}

strat.short = function() {
  this.params.position = 'short';
  this.stoplose = this.candle.close + (this.candle.close * stopLoseProcent / 100);
  this.nextProfit = this.candle.close - (this.candle.close * profitPercent / 100);
  this.advice('short');
  return true;
}

strat.long = function() {
  this.params.position = 'long';
  this.stoplose = this.candle.close - (this.candle.close * stopLoseProcent / 100);
  this.nextProfit = this.candle.close + (this.candle.close * profitPercent / 100);
  this.advice('long');
  return true;
}

strat.checkStopLoss = function() {
  if (this.params.position === 'short') {
    if (this.candle.close >= this.stoplose) {
      return this.long();
    }
  } else if (this.params.position === 'long') {
    if (this.candle.close >= this.stoplose) {
      return this.short();
    }
  }
}

strat.checkProfit = function() {
  if (this.params.position === 'short') {
    if (this.nextProfit && this.nextProfit > this.candle.close) {
      return this.long();
    }
  } else if (this.params.position === 'long') {
    if (this.nextProfit && this.nextProfit < this.candle.close) {
      return this.short();
    }
  }
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {

  // if (this.checkStopLoss()) {
  //   return;
  // }

  // if (strat.checkProfit()) {
  //   return;
  // }

  if (this.tradezone) {
    if (this.trend === 'up') {
      if (this.params.position === 'short') {
        return this.long();
      }
    }

    if (this.trend === 'down') {
      if (this.params.position === 'long') {
        return this.short();
      }
    }
  }

}

module.exports = strat;
