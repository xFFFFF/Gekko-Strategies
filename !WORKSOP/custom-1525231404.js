// helpers
// var _ = require('lodash');
var log = require('../core/log.js');

//var config = require('../core/util.js').getConfig();
//var settings = config.buyatsellat;
//log.debug(settings)

// let's create our own method
var method = {};

// prepare everything our method needs
  method.init = function() {
  this.name = 'buyatsellat';

  this.previousAction = 'sell';
  this.previousActionPrice = 0;
}

// What happens on every new candle?
method.update = function(candle) {
  //log.debug('in update');
}

// for debugging purposes log the last 
// calculated parameters.
method.log = function(candle) {
  //log.debug(this)
}

method.check = function(candle) {  
  log.debug('LAST PRICE: ' + candle.close)
  const buyat = 1.05; // amount of percentage of difference required
  const sellat = 0.97; // amount of percentage of difference required
  const stop_loss_pct = 0.95; // amount of stop loss percentage
  const sellat_up = 1.01; // amount of percentage from last buy if market goes up

  if(this.previousAction === "buy") {
    // calculate the minimum price in order to sell
    const threshold = this.previousActionPrice * buyat;

    // calculate the stop loss price in order to sell
    const stop_loss = this.previousActionPrice * stop_loss_pct;

    // we sell if the price is more than the required threshold or equals stop loss threshold
    if((candle.close > threshold) || (candle.close < stop_loss)) {
    log.debug('SELLING: LP ' + candle.close + ' IGT> Threshold ' + threshold + ' OR LP ' + candle.close + ' ILT< Stoploss ' + stop_loss)
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
    log.debug('BUYING: LP ' + candle.close + ' ILT< Threshold ' + threshold + ' OR LP ' + candle.close + ' IGT> Sell_at_up_price ' + sellat_up_price)
      this.advice('long');
      this.previousAction = 'buy';
      this.previousActionPrice = candle.close;
    }
  }
}

module.exports = method;
