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
var _ = require('lodash');
var config = require('../core/util.js').getConfig();
var settings = config.loosai;

var strat = {};

// Prepare everything our method needs
strat.init = function () {
  console.log("init", settings);
  this.addIndicator('loosai', 'LOOSAI', settings);
  console.log('111');
  // //just rename for short
  this.loosai = this.indicators.loosai;
  console.log('222',this.loosai);
}

// What happens on every new candle?
strat.update = function (candle) {}

// For debugging purposes.
strat.log = function () {
  // log.debug('calculated random number:');
  // log.debug('\t', this.randomNumber.toFixed(3));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function (c) {
  this.loosai.addCandle(c);
  if(this.loosai.canBuy) {
    if(this.loosai.matchBuyCase1() || this.loosai.matchBuyCase2()) {
      this.loosai.snapshotBuy();
      this.advice('long');
    }
  } else {
    if(this.loosai.matchSellCase()) {
      this.loosai.snapshotSell();
      this.advice('short');
    }
  }
  this.loosai.record();
}

module.exports = strat;
