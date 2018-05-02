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
var oosai = require('./indicators/OOSAI.js');
var _ = require('lodash');
var config = require('../core/util.js').getConfig();
var settings = config.oosai;
const TEST_ENABLED = false;
// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function () {
  console.log("init", settings);
  this.watch = false;
  this.addIndicator('oosai', 'OOSAI', settings);
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
strat.check = function (candle) {
  if (!this.watch) {
    let cond1 = this.indicators.oosai.checkBuyCondition1(candle);
    let cond2 = this.indicators.oosai.checkBuyCondition2(candle);
    console.log('check buy', `${this.watch},${cond1},${cond2}` );
    if (cond1 || cond2) {
      this.advice('long');
      this.watch = true;
      this.indicators.oosai.snapshotLong('case', candle.close);
      console.log('buy', candle.close);
    }
  } else {
    let cond3 = this.indicators.oosai.checkSellCondition1(candle);
    console.log('check sell', `${this.watch},${cond3}` );
    if (cond3) {
      this.advice('short');
      this.watch = false;
      this.indicators.oosai.reset();
      console.log('sell', candle.close);
    } 
  }
  // console.log('check', `${this.watch}` );
}

if (TEST_ENABLED) {
  var Consultant = function () {}
  _.each(strat, function (fn, name) {
    Consultant.prototype[name] = fn;
  });

  module.exports = Consultant;
} else {
  module.exports = strat;
}
