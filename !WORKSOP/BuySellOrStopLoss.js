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
  this.input = 'candle';
  this.requiredHistory = 1;

  this.trend  ={
    sell : false,
    buy : false,
    lastOperation : null,
    stopLossExecuted: false,
    tradeCount: 0
  };

  //Determine if we first want to buy or sell
  if(this.settings.firstTrade === 'buy') {
    this.trend.lastOperation = 'sell';
  }
  else {
    this.trend.lastOperation = 'buy';
  }
}

// What happens on every new candle?
strat.update = function(candle) {

  if(!candle){
    log.error("No candle received on update WTF?");
    return;
  }

  //Resetting trend on new candle price:
  this.trend.buy = false;
  this.trend.sell = false;

  log.info("Candle close price: "+candle.close);

  var sell = this.settings.sell;
  var stopLoss =  this.settings.stopLoss;
  var buy = this.settings.buy;
  var buyRange = this.settings.buyRange;

  if(stopLoss.pauseOnStopLoss && this.trend.stopLossExecuted){
    log.info("Stop Loss pause enabled. Won't execute another buy or sell");
    return;
  }

  if(this.trend.tradeCount >= this.settings.tradeLimit){
    log.info("Trade limit reached will not execute anymore trades");
    return;
  }

  log.info("lastOperation :" +this.trend.lastOperation);

  if(this.trend.lastOperation !== 'sell') {
    if (sell.enabled && candle.close >= sell.limitPrice) {
      log.info("LIMIT PRICE REACHED!: " + sell.limitPrice + " CANDLE CLOSE: " + candle.close);
      this.trend.sell = true;
    }
    else if (stopLoss.enabled && candle.close <= stopLoss.lessThanOrEqualTo) {
      log.info("STOP LOSS REACHED :" + stopLoss.lessThanOrEqualTo + " CANDLE CLOSE: " + candle.close);
      this.trend.sell = true;
      this.trend.stopLossExecuted = true;
    }

  }

  else if(this.trend.lastOperation !== 'buy' ) {
    if (buy.enabled && buy.limitPrice >= candle.close)
    {
      log.info("BUY LIMIT REACHED : " + buy.limitPrice);
      this.trend.buy = true;
    }
    else if(buyRange.enabled && candle.close >= buyRange.greaterThanOrEqualTo && candle.close <= buyRange.lessThanOrEqualTo){
      log.info("BUY RANGE REACHED : "+buyRange.greaterThanOrEqualTo +" <="+ candle.close+" <= "+buyRange.lessThanOrEqualTo);
      this.trend.buy = true;
    }

  }
  else{
    log.info("No Limit or Stop Loss reached");
  }

}

// For debugging purposes.
strat.log = function() {
  //log.debug('');
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {


  if(this.trend.sell){
    this.trend.sell = false;
    log.info("Going to sell!");
    this.advice("short");
    this.trend.lastOperation = 'sell';
    this.trend.tradeCount++;
  }

  else if(this.trend.buy){
    this.trend.buy = false;
    log.info("Going to buy!");
    this.advice("long");
    this.trend.lastOperation = 'buy';
    this.trend.tradeCount++;
  }

  else{
    log.info("Nothing to buy or sell");
    this.advice();
  }

}

module.exports = strat;
