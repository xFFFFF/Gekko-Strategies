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
  this.localDb = [];
  this.localDbMaxLen = 100;
};

// What happens on every new candle?
strat.update = function(candle) {

  let dbElement = {
    price: candle.close
  };
  this.localDb.push(dbElement);
  if (this.localDb.length >= this.localDbMaxLen) this.localDb.shift();
  log.info('New element\n', dbElement);
};

// For debugging purposes.
strat.log = function() {
};

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {
  for (var name in signals) {
    let advice = signals[name](this.localDb);
    console.log(advice);
    if (advice) this.advice(advice);
  }
};

const signals = {

  pump: (localDb) => {
    let currentPrice = localDb[localDb.length - 1];
    let twoMinutePrice = localDb[localDb.length - 3];
    let difference = currentPrice - twoMinutePrice;
    let change = difference / twoMinutePrice;
    if (difference > 0 && change > 0.01) {
      return 'telegram: PUMP!';
    }
  }

};

module.exports = strat;
