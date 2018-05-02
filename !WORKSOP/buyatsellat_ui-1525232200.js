// helpers
// var _ = require('lodash');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.buyatsellat_ui;

// let's create our own method
var method = {};

// prepare everything our method needs
  method.init = function() {
  this.name = 'buyatsellat_ui';

  this.previousAction = 'sell';
  this.previousActionPrice = null;
}

// What happens on every new candle?
method.update = function(candle) {
  //log.debug('in update');
}

// for debugging purposes log the last 
// calculated parameters.
method.log = function(candle) {
  // log.debug(this.previousAction);
}

method.check = function(candle) {  
  var buyat = settings.buyat; // amount of percentage of difference required
  var sellat = settings.sellat; // amount of percentage of difference required
  var stop_loss_pct = settings.stop_loss_pct; // amount of stop loss percentage
  var sellat_up = settings.sellat_up; // amount of percentage from last buy if market goes up
  var low_buy_pct = settings.low_buy_pct; //amount of percentage to buy if market falls below stop loss

  if(this.previousAction === "buy") {
    // calculate the minimum price in order to sell
    var threshold = this.previousActionPrice * buyat;

    // calculate the stop loss price in order to sell
    var stop_loss = this.previousActionPrice * stop_loss_pct;

    // calculate the LowBuyPrice in order to buy
    // var LowBuyPrice = this.previousActionPrice * low_buy_pct;

    // action to take if the price is greater than stop loss (not yet upto stop loss)
    // note that stop loss is lower than previousActionPrice
    // for example, if we buy at $100, according to our settings, stop loss would be 100 * 0.85 = $85
    // if(candle.close > stop_loss){
    //   //price not yet at threshold: decision = "Wait"
    //   if(candle.close < threshold){
    //     this.advice();
    //     this.previousActionPrice = candle.close;
    //     console.log('Price less than threshold: No Decision Taken - ', threshold);
    //   }else {
    //     //price equalTo or GreaterThan threshold: decision = "Sell"
    //     this.advice('short');
    //     this.previousAction = 'sell';
    //     this.previousActionPrice = candle.close;
    //     console.log("Price greater than threshold: selling BTC @", candle.close);
    //   }
    // }else if(candle.close < stop_loss){
    //   //price less than the stop loss but not yet upto LowBuyPrice(less than $85, say $84)
    //   if(candle.close > LowBuyPrice){
    //     //we wait
    //     this.advice();
    //     this.previousActionPrice = candle.close;
    //     console.log('Price greater than LowBuyPrice: No Decision Taken - ', LowBuyPrice);
    //   }else if(candle.close == LowBuyPrice){
    //     //else if the price is equalTo LowBuyPrice, we buy
    //     this.advice('long');
    //     this.previousAction = 'buy';
    //     this.previousActionPrice = candle.close;
    //     console.log("Price equalTo LowBuyPrice: buying BTC @", candle.close);
    //   }else{
    //     //we sell... market has fallen too deep
    //     this.advice('short');
    //     this.previousAction = 'sell';
    //     this.previousActionPrice = candle.close;
    //     console.log("Market fallen too deep: selling BTC @", candle.close);
    //   }
      if((candle.close >= threshold) && (candle.close >= sellat_up_price)) {
      this.advice('long');
      this.previousAction = 'buy';
      this.previousActionPrice = candle.close;
      console.log("buying BTC @", candle.close);
      }
    }

  if(this.previousAction === "sell") {
  // calculate the minimum price in order to buy
    var threshold = this.previousActionPrice * sellat;

  // calculate the price at which we should buy again if market goes up
    var sellat_up_price = this.previousActionPrice * sellat_up;

    //action to take if price
    // if(candle.close < sellat_up_price){
    //   //price not yet at threshold: decision = "Wait"
    //   if(candle.close > threshold){
    //     this.advice();
    //     this.previousActionPrice = candle.close;
    //     console.log('Price greater than threshold. No Decision Taken - ',threshold);
    //   }else {
    //     //price less than the sellat_up_price: decision = "Sell Again"
    //     this.advice('short');
    //     this.previousAction = 'sell';
    //     this.previousActionPrice = candle.close;
    //     console.log("Price above SellAtUp. selling BTC @", candle.close);
    //   }
    // }else if(candle.close > sellat_up_price){
    //     //price equalTo or lessThan threshold: decision = "Buy"
    //     this.advice('long');
    //     this.previousAction = 'buy';
    //     this.previousActionPrice = candle.close;
    //     console.log("Price equalTo or LessThan threshold. Buying BTC @", candle.close);
    //   }
    // }

    // we buy if the price is less than the required threshold or greater than Market Up threshold
    if((candle.close <= threshold) || (candle.close <= sellat_up_price)) {
      this.advice('long');
      this.previousAction = 'buy';
      this.previousActionPrice = candle.close;
      console.log("buying BTC @", candle.close);
    }
  }
}

module.exports = method;