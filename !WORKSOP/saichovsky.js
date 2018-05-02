// fork of buyatsellat with trailing stop loss
// var _ = require('lodash');
var helper = require('../helper.js');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.saichovsky;

var timeToSell = function(t) {
  if(t.pLimits.length == 2) {
    return ((t.pLimits[0] > t.pLimits[1]) || (t.profitLimit >= t.pLimits[0]));
  }
}

// let's create our own strategy
var strategy = {};

// prepare everything our strategy needs
strategy.init = function() {
  this.name = 'saichovsky';
  this.stopLoss = helper.trailingStopLoss(); // state object
  this.stopPrice = Infinity;
  this.buyPrice = null;
  this.profitLimit = null;
  this.PL_surpassed = false;
  this.pLimits = [];

  this.previousAction = 'sell';
  this.previousActionPrice = Infinity;
  
  console.log("If this strategy is of benefit to you, please send me some BTC at 1YfiobTtbfpjn1FCyHY2ofsZ5oYTkKQ8h :-)");
}

// What happens on every new candle?
strategy.update = function(candle) { // push up profit limit if price goes up after buying
  if(this.previousAction == 'buy') {
    const _newProfitLimit = settings.profitLimit * candle.close;

    if(_newProfitLimit > this.profitLimit) {
      //this.profitLimit = _newProfitLimit;
      if(this.pLimits.length == 2) {
        this.pLimits.shift();
      }
      this.pLimits.push(_newProfitLimit);
      //this.PL_surpassed = true;
    }
    //log.info("{\"Action\": \"UPDT\", \"StopPrice\": \"" + this.stopPrice.toFixed(4) + "\", \"PreviousPrice\": \"" + candle.close.toFixed(4) + "\", \"ProfitLimit\": \"" + this.profitLimit.toFixed(4) + ", \"newLimit\": \"" + this.pLimits[0].toFixed(4) + "\"}");
    try{
      log.info("UPDT," + this.stopPrice.toFixed(4) + "," + candle.close.toFixed(4) + "," + this.profitLimit.toFixed(4) + "," + this.pLimits[0].toFixed(4) + "," + this.pLimits[1].toFixed(4));
    }
    catch(e) {
      //
    }
    //log.info("{\"Action\": \"" + this.previousAction[0].toUpperCase() + this.previousAction.substring(1) + "\", \"StopPrice\": \"" + this.stopPrice.toFixed(4) + "\", \"PreviousPrice\": \"" + candle.close.toFixed(4) + "\", \"ProfitLimit\": \"" + this.profitLimit.toFixed(4) + "\"}");
  }
}

// for debugging purposes log the last
// calculated parameters.
strategy.log = function(candle) {
  // log
}

strategy.check = function(candle) { // this is where we decide on what to do - buy or sell
  if(this.stopLoss.active()) { // if LastAction was a buy
    if ((this.stopLoss.triggered(candle.close)) || (timeToSell(this) ) && (candle.close > this.profitLimit)) { // and SL has been triggered or price < profitLimit
      this.advice('short'); // sell
      this.previousAction = 'sell';
      this.previousActionPrice = candle.close;
      this.advised = false;
      //log.info("stopLossTriggered?: " + this.stopLoss.triggered(candle.close));
      //log.info("{\"Action\": \"" + this.previousAction[0].toUpperCase() + this.previousAction.substring(1) + "\", \"StopPrice\": \"" + this.stopPrice.toFixed(4) + "\", \"PreviousPrice\": \"" + candle.close.toFixed(4) + "\", \"ProfitLimit\": \"" + this.profitLimit.toFixed(4) + ", \"newLimit\": \"" + this.pLimits[0].toFixed(4) + "\"}");
      this.pLimits[1] = (this.pLimits.length < 2) ? 0 : this.pLimits[1];
      log.info(this.previousAction[0].toUpperCase() + this.previousAction.substring(1) + "," + this.stopPrice.toFixed(4) + "," + candle.close.toFixed(4) + "," + this.profitLimit.toFixed(4) + "," + this.pLimits[0].toFixed(4) + "," + this.pLimits[1].toFixed(4));

      this.stopLoss.destroy();
    }
  }
  else { // last action was a sell
    const stopLossLimit = settings.stopLossLimit; // stop loss percentage
    const buyAtDrop = settings.buyAtDrop; // % of last sale price to buy at if market goes down
    const buyAtRise = settings.buyAtRise; // % of last sale price to buy at if market goes up

    // calculate the minimum price in order to buy
    const lower_buy_price = this.previousActionPrice * buyAtDrop;

    // calculate the price at which we should buy again if market goes up
    const upper_buy_price = this.previousActionPrice * buyAtRise;

    // we buy if the price is less than the required threshold or greater than Market Up threshold
    if((candle.close <= lower_buy_price) || (candle.close >= upper_buy_price)) {
      this.advice('long');
      this.previousAction = 'buy';
      this.previousActionPrice = candle.close;
      this.stopLoss.create(stopLossLimit, this.previousActionPrice);
      this.stopPrice = this.stopLoss.update(this.previousActionPrice);
      this.profitLimit = settings.profitLimit * this.previousActionPrice;
      this.pLimits.length = 0;

      this.pLimits.push(this.profitLimit);
      // log previousAction, stopPrice, candle.close and profitLimit
      log.info(this.previousAction[0].toUpperCase() + this.previousAction.substring(1) + "," + this.stopPrice.toFixed(4) + "," + candle.close.toFixed(4) + "," + this.profitLimit.toFixed(4) + "," + this.pLimits[0].toFixed(4));
      //log.info("{\"Action\": \"" + this.previousAction[0].toUpperCase() + this.previousAction.substring(1) + "\", \"StopPrice\": \"" + this.stopPrice.toFixed(4) + "\", \"PreviousPrice\": \"" + candle.close.toFixed(4) + "\", \"ProfitLimit\": \"" + this.profitLimit.toFixed(4) + ", \"newLimit\": \"" + this.pLimits[0].toFixed(4) + "\"}");
    }
  }
}

module.exports = strategy;
