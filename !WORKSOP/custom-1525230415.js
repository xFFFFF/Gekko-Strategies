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
  this.input = 'candle';
  this.requiredHistory = this.tradingAdvisor.historySize
  this.percentageSinceBreak = this.settings.percentageSinceBreak
  this.history = []
  this.length = 24
  this.min = null
}

// What happens on every new candle?
strat.update = function(candle) {
  if(!this.min) this.min = candle.close

  this.history.push(candle.close)
  this.history = this.history.splice(-this.length)
  for (let i = 0; i < this.history.length - 3; i++) {

    if(this.history[i+3]/this.history[i] > 1.08){
      this.min = this.history[i]
    }
  }
}

// For debugging purposes.
strat.log = function() {

}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function(candle) {

  if(this.currentTrend !== 'long' && candle.close / this.min < this.percentageSinceBreak) {
    this.advice('long')
    this.currentTrend = 'long'
    this.targetPrice = this.min
  }

  if(this.currentTrend === 'long' && (this.targetPrice <= candle.close)) {
    this.advice('short')
    this.currentTrend = 'short'
  }
}

module.exports = strat;
