// helpers
// var _ = require('lodash');
var helper = require('../helper.js');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.buyatsellat;

// let's create our own method
var method = {};

// prepare everything our method needs
  method.init = function() {
  this.name = 'buyatsellat';

  this.previousAction = 'sell';
  this.previousActionPrice = Infinity;
}

// What happens on every new candle?
method.update = function(candle) {
  //log.debug('in update');
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  //log.debug(this.previousAction)
}

method.check = function(candle) {
  const profitLimit = settings.profitLimit; // percentage above buying price at which to sell
  const stopLossLimit = settings.stopLossLimit; // stop loss percentage
  const buyAtDrop = settings.buyAtDrop; // % of last sale price to buy at if market goes down
  const buyAtRise = settings.buyAtRise; // % of last sale price to buy at if market goes up

  if(this.previousAction === "buy") {
    // calculate the minimum price in order to sell
    const threshold = this.previousActionPrice * profitLimit;

    // calculate the stop loss price in order to sell
    const stop_loss = this.previousActionPrice * stopLossLimit;

    // we sell if the price is more than the required threshold or equals stop loss threshold
    if((candle.close > threshold) || (candle.close < stop_loss)) {
      this.advice('short');
      this.previousAction = 'sell';
      this.previousActionPrice = candle.close;
    }
  }

  else if(this.previousAction === "sell") {
  // calculate the minimum price in order to buy
    const threshold = this.previousActionPrice * buyAtDrop;

  // calculate the price at which we should buy again if market goes up
    const sellat_up_price = this.previousActionPrice * buyAtRise;

    // we buy if the price is less than the required threshold or greater than Market Up threshold
    if((candle.close < threshold) || (candle.close > sellat_up_price)) {
      this.advice('long');
      this.previousAction = 'buy';
      this.previousActionPrice = candle.close;
    }
  }
}

module.exports = method;
