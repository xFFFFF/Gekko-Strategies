// helpers
// var _ = require('lodash');
var log = require('../core/log.js');

//var config = require('../core/util.js').getConfig();
//var settings = config.buyatsellat;

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
	const buyat = 1.05; // profit limit percentage (e.g. 1.15 for 15%)
	const sellat = 0.97; // amount of percentage from last buy if market goes down (e.g. 0.97 for 3%)
	const stop_loss_pct = 0.95; // stop loss percentage (e.g. 0.95 for 5%)
	const sellat_up = 1.01; // amount of percentage from last buy if market goes up (e.g. 1.01 for 1%)

  if(this.previousAction === "buy") {
    // calculate the minimum price in order to sell
    const threshold = this.previousActionPrice * buyat;

    // calculate the stop loss price in order to sell
    const stop_loss = this.previousActionPrice * stop_loss_pct;

    // we sell if the price is more than the required threshold or equals stop loss threshold
    if((candle.close > threshold) || (candle.close < stop_loss)) {
      this.advice('short');
      this.previousAction = 'sell';
      this.previousActionPrice = candle.close;
    }
  }

  else if(this.previousAction === "sell") {
  // calculate the minimum price in order to buy
    const threshold = this.previousActionPrice * sellat;

  // calculate the price at which we should buy again if market goes up
    const sellat_up_price = this.previousActionPrice * sellat_up;

    // we buy if the price is less than the required threshold or greater than Market Up threshold
    if((candle.close < threshold) || (candle.close > sellat_up_price)) {
      this.advice('long');
      this.previousAction = 'buy';
      this.previousActionPrice = candle.close;
    }
  }
}

module.exports = method;
