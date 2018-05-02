//
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md
//

var config = require('../core/util.js').getConfig();
var settings = config.custom;

var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.currentTrend = 'short';
  this.requiredHistory = 0;
}

// What happens on every new candle?
strat.update = function(candle) {

  // Get a random number between 0 and 1.
  this.randomNumber = Math.random();

  // There is a 10% chance it is smaller than 0.1
  this.toUpdate = this.lastPrice > settings.short || this.lastPrice < settings.long

}

// For debugging purposes.
strat.log = function() {
  log.write('calculated random number:');
  log.write('\t', this.randomNumber.toFixed(3));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {

  // Only continue if we have a new update.
  if(!this.toUpdate)
    return;

  if(this.currentTrend === 'long' && this.lastPrice > settings.short) {

    // If it was long, set it to short
    this.currentTrend = 'short';
    this.advice('short');

  } else if(this.currentTrend === "short" && this.lastPrice < settings.long){

    // If it was short, set it to long
    this.currentTrend = 'long';
    this.advice('long');

  }
}

module.exports = strat;
