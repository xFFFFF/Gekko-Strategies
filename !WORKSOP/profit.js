//
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md
//
var fs = require('fs');
var parse = require('csv-parse');
var inputFile='../profit/eth/target.json';
var config = require('../core/util.js').getConfig();
var settings = config.profit;
var log = require('../core/log');

var strat = {};
var target;
// Prepare everything our method needs
strat.init = function() {
  this.currentTrend;
  this.requiredHistory = 0;
}

// What happens on every new candle?
strat.update = function(candle) {
  var obj = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  target = obj.prediction
  this.toUpdate = this.lastPrice > target && this.currentTrend != 'short' || this.lastPrice < target && this.currentTrend != 'long';

  console.log("target:  " + target + " last: " + this.lastPrice)	
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

  if(this.currentTrend != 'short' && this.lastPrice > target) {

    // If it was long, set it to short
    this.currentTrend = 'short';
    this.advice('short');

  } else if(this.currentTrend != "long" && this.lastPrice < target * 0.99){

    // If it was short, set it to long
    this.currentTrend = 'long';
    this.advice('long');

  }
}

module.exports = strat;
