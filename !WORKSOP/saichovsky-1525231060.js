// helpers
// var _ = require('lodash');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.buyatsellat_ui;

// let's create our own method
var method = {};

// prepare everything our method needs
  method.init = function() {
  this.name = 'saichovsky';

  this.previousAction = 'sell';
  this.previousActionPrice = Infinity;

  this.threShold = 0.0;
  this.stopLoss = 0.0;
  this.sellatUpPrice = 0.0;
}

// What happens on every new candle?
method.update = function(candle) {
  //log.debug('in update');

  // price has gone up and we need to sell. Push up threshold and stop loss amounts
  if(this.previousAction === "buy") && (candle.close > this.previousActionPrice) {
    this.threShold = candle.close * buyat;
    this.stopLoss = this.threShold * settings.stop_loss_pct;
  }
  // price has gone down and we need to buy. Push down buying price
  else if(this.previousAction === "sell") && (candle.close < this.previousActionPrice) {
    this.threShold = candle.close * settings.sellat;
    this.sellatUpPrice = this.threShold * settings.settings.sellat_up;
  }
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  //log.debug(this.previousAction)
}

// update whatever info
method.check = function(candle) {
  const buyat = settings.buyat; // amount of percentage of difference required
  const sellat = settings.sellat; // amount of percentage of difference required
  const stop_loss_pct = settings.stop_loss_pct; // amount of stop loss percentage
  const sellat_up = settings.sellat_up; // amount of percentage from last buy if market goes up

  if(this.previousAction === "buy") {
    // calculate the minimum price in order to sell
    const threshold = this.threShold * buyat;

    // calculate the stop loss price in order to sell
    const stop_loss = this.threShold * stop_loss_pct;

    // we sell if the price is more than the required threshold or equals stop loss threshold
    if((candle.close < this.threShold) || (candle.close <= this.stopLoss)) {
      this.advice('short');
      this.previousAction = 'sell';
      this.previousActionPrice = candle.close;
    }
  }
  
  //nilifika hapa

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
