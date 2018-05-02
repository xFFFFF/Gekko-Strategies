/*
  ######   22/12/2017   ######

  ############################
  ############################

  ### This Strat is a simple synchronous strategy that can be easily adapted to any fast paced market ###
  ### It uses Trailing Buy/Sell Points ###
  ### It works like this:
        - At a certain price, check if the previous persistent price is less than or greater than current price
        - If current price is lesser, keep watching until BUY at low levels (TRAILING BUY).
        - If current price is greater, keep watching until SELL at high levels (TRAILING SELL).
  ### Variables we need:
        - a very small threshold for both up/down movements (recommended: down=0.999; up=1.0001)
        - current price
        - threshold price (for both up/down movements)

  ### (31/12/17) Update: TRAILING BUY works for UPTREND but not for DOWNTREND or SIDEWAYS MOVEMENT ###
  ###   DEMA Indicator can tell us a downtrend, so I will attach the DEMA Indicator   ###

  ###  (1/1/18) Update: It is a new year, but I have to keep on working.  ###
  ###   Our Strategy should do this now...
          - Initialize a BUY Trade using DEMA's advice
          - Use Trailing Sell Point for the initialized BUY Trade

  ###  (2/1/18) Update: DEMA is not a strong indicator afterall. I will adapt another indicator ###

  ###  (19/1/18) Update: New Strategy Title:- BUY ONCE TRAIL ONCE (BOTO). This strat buys once, uses the TSP, and then stops.


  ### Developed by Laravellous (c) 2018 for DWT.ng  ###

  ##################################################################################################################
*/

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'Strat';

  this.UpperThreshold = this.settings.thresholds.up;
  this.LowerThreshold = this.settings.thresholds.down;

  this.PreviousPrice;
  this.CurrentPrice;
  this.PreviousAction;

  //used to calculate TakeProfit
  this.BoughtPrice;
  this.TrailPercent = 0.03;
  this.TakeProfit = this.NewTakeProfit;
  this.NewTakeProfit = 0;

  //used to calculate Profit/Loss
  this.Total = 0;
  this.ProfitLoss;

  //used to initialize Trade
  this.trade = false;

  // this.currentTrend;
  this.requiredHistory = this.tradingAdvisor.historySize;
}

// what happens on every new candle?
method.update = function(candle) {
  this.PreviousPrice = this.CurrentPrice;
  this.CurrentPrice = candle.close;
}

// for debugging purposes
method.log = function(candle) {
}

method.check = function(candle) {
  // var dema = this.indicators.dema;
  // var diff = dema.result;
  // var DEMASaysBUY = diff > this.settings.handle.up;
  // var DEMASaysSELL = diff < this.settings.handle.down;

  var price = candle.close;
  var BuyPrice = this.PreviousPrice * this.UpperThreshold;
  var SellPrice = this.PreviousPrice * this.LowerThreshold;
  var TrailPrice = this.BoughtPrice * this.TrailPercent;

  var message = '@ ' + price.toFixed(8);

  if(!this.trade){
    //First Time Buying
    if(price>BuyPrice){
    this.advice('long');
    this.trade = true;
      this.PreviousAction = 'buy';
      log.debug('*** First Trade Advice: BUY', message);      
      this.BoughtPrice = price;
    }else{
      // Keep Patiently Waiting
      this.advice();
      log.debug('### Watching For Buy Point', message);
    }
  }

  // For Trailing Sell Point
  if(this.PreviousAction == 'buy'){
    // if(price == TrailPrice){
    //   TrailPrice = NewTrail;
    // }
    if (price <= SellPrice){
      this.advice('short');
      this.PreviousAction = 'sell';
      log.debug('*** Trade Advice: SELL', message);
      //Calculate Profit/Loss at any Sell point
      this.ProfitLoss = price - this.BoughtPrice;
      this.Total += this.ProfitLoss;
      log.debug(' >>>> Profit/Loss: BTC',this.ProfitLoss.toFixed(8));
      log.debug('Total Profit/Loss: ', this.Total.toFixed(8));
    }else{
      // For Profits $$$
      this.advice();
      log.debug('### Watching For Sell Point', message);
    }
  }

  // For Trailing Buy Point (remember, the price has to be really low for a good buy)
  if(this.PreviousAction == 'sell'){
    // log.debug('PreviousAction = sell');
    if (price > BuyPrice){
      this.advice('long');
      this.PreviousAction = 'buy';
      log.debug('*** Trade Advice: BUY', message);      
      this.BoughtPrice = price;
    }else{
      // Keep Patiently Waiting
      this.advice();
      log.debug('### Watching For Buy Point', message);
    }
  }

}

module.exports = method;