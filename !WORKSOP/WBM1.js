


// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var util = require('../core/util.js');

// let's create our own method
var method = {};



// prepare everything our method needs
method.init = function() {

  this.name = 'WBM1';

  this.currentTrend;
  this.requiredHistory = 0;

  this.buyPrice = this.settings.initialBuyPrice ? this.settings.initialBuyPrice : 0;

  this.tradeLimit = this.settings.tradeLimit;
  this.tradeCount = 0;

  this.nextOperation = this.settings.firstTrade;
  this.rsiSellPoint = this.settings.rsiSellPoint;


  log.debug("Short DEMA size: "+this.settings.shortSize);
  log.debug("Long DEMA size: "+this.settings.longSize);
  log.debug("RSI  size: "+this.settings.rsiSize);

  this.addTalibIndicator('shortDEMA', 'dema', {optInTimePeriod : this.settings.shortSize});
  this.addTalibIndicator('longDEMA', 'dema', {optInTimePeriod : this.settings.longSize});
  this.addTalibIndicator('rsi', 'rsi', {optInTimePeriod : this.settings.rsiSize});

  log.debug(this.name+' Strategy initialized');

  //log.debug("This is the object",this);
};

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
};

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  var shortDEMA = this.talibIndicators.shortDEMA;
  var longDEMA = this.talibIndicators.longDEMA;
  var rsi = this.talibIndicators.rsi;


  log.debug('calculated DEMA properties for candle:');

  log.debug('\t shortDEMA :', shortDEMA.result);

  log.debug('\t', 'longDEMA:', longDEMA.result);

  log.debug('\t', 'rsi:', rsi.result);

};

method.processTrade =  function(trade){

  if(trade){

    this.isTrading =  false;


    if(trade.price == 0){
      log.debug("The price of the trade is zero. This trade is invalid most likely due to a cancel. ");
      log.debug("Going to ignore this trade info and proceed.");
      return;
    }


    this.lastTrade =  trade;

    //Resetting
    if(trade.action == 'buy'){
      this.buyPrice = trade.price;
      this.nextOperation = 'sell'
    }
    else if(trade.action == 'sell'){
      this.buyPrice = trade.price;
      this.nextOperation = 'buy'
    }

    log.debug("\t","Trade info: " ,trade);
  }

}

method.check = function(candle) {


  if(this.tradeLimit != -1 && this.tradeCount >= this.tradeLimit ){
    log.debug("The trade limit has been reached. No other operations will be taken");
    return;
  }


  //Check to see if we should cancel any orders
  if(this.checkSlippage(candle)){
    return;
  }

  var shortResult = this.talibIndicators.shortDEMA.result.outReal;
  var longResult = this.talibIndicators.longDEMA.result.outReal;
  var rsiResult =  this.talibIndicators.rsi.result.outReal;
  var price = candle.close;


  var message = '@ ' + price.toFixed(8);


  //User has requested that we take profit as soon as it is reached.
  if(this.nextOperation == 'sell' && this.settings.sellOnProfit && this.canSell(candle)){
    log.debug("Desired profit has been reached!");

    this.advice('short');

    log.debug("Going to sell");
    this.tradeCount++;
    this.isTrading =  true;
  }

  //DEMA Golden Cross / Uptrend
  else if(shortResult >  longResult) {

    log.debug('we are currently in uptrend', message);

    // If the next operation is a buy and RSI is in the buy point range
    //A Golden Cross has occurred buy
    if(this.nextOperation == 'buy' && this.settings.enableBuyOnGC && this.currentTrend == 'down'){

        this.advice('long');

        log.debug("Golden Cross");
        log.debug("Going to buy");
        this.tradeCount++;
        this.isTrading =  true;
    }

    //Overbought and we're in the money let's dump it here and cash out.
    else if (this.isOverbought() ){

      this.advice('short');

      log.debug("The asset appears to be overbought");
      log.debug("Going to sell");
      this.tradeCount++;
      this.isTrading =  true;
    }

    //Nothing to do
    else {

      log.debug("Nothing to buy");
      this.advice();

    }

    this.currentTrend = 'up';
  }


  // COD / Downtrend
  else if(longResult > shortResult) {

    log.debug('we are currently in a downtrend', message);
    if(this.currentTrend == 'up' &&  this.nextOperation == 'sell' && this.canSell(candle)) {

      this.advice('short');
      log.debug("COD Going to sell");
      this.tradeCount++;
      this.isTrading =  true;
    }

    else if(this.nextOperation == 'buy' && !this.settings.buy && this.canBuy(candle)){

      this.advice('long');

      log.debug("Going to buy at the dip");
      this.tradeCount++;
      this.isTrading =  true;
    }

    else {
      log.debug("Nothing to sell");
      this.advice();
    }

    this.currentTrend = 'down';
  }

  else {
    log.debug('we are currently not in an up or down trend', message);
    this.advice();
  }
};


method.canBuy =  function(candle) {

  if(!this.settings.enableBuyLow){
    return false;
  }

  var rsiResult =  this.talibIndicators.rsi.result.outReal;
  var rsiBuyPoint =  this.settings.rsiBuyPoint;

  if(rsiBuyPoint > rsiResult){
    log.debug("This asset is underbought we can buy!",'RSI:',rsiResult);
    return true;
  }

  return false;
};


method.isOverbought = function(){

  if(this.settings.sellOnOverbought == false){
    return false;
  }

  var rsiResult =  this.talibIndicators.rsi.result.outReal;
  return this.nextOperation == 'sell' && rsiResult >= this.rsiSellPoint;
};

method.checkSlippage =  function(candle){

  if(this.isTrading == true){

    //Let's check to see if there has been any slippage, if so let's cancel this order:
    if(this.nextOperation == 'sell' && !this.isOverbought() && !this.canSell(candle)){
      log.debug("Looks like slippage has occurred and the sell trade request is no longer favorable.  Let's attempt a cancel!");
      this.advice('cancel');
      return true;
    }
    else if(this.nextOperation == 'buy' && !this.settings.enableBuyOnGC && !this.canBuy(candle)){
      log.debug("Looks like slippage has occurred and the buy trade request is no longer favorable.  Let's attempt a cancel!");
      this.advice('cancel');
      return true;
    }

    log.debug("A trade is currently in progress. Waiting for trade to complete.");
    return true;
  }
  return false;
};

method.canSell = function(candle){


  var profitMargin =  this.settings.profitMarginPercentage / 100;
  var potentialProfitMargin;

  //no last trade info so we can't calculate fee cost but let's make sure we have the right profit margin at least
  if(!this.lastTrade){

    potentialProfitMargin = 1 - (this.buyPrice / candle.close);

    log.debug("Potential profit margin",potentialProfitMargin);
  }

  else if( this.lastTrade.action !== 'buy' ){
    return false;
  }

  //use this method when we have trade info to account for fees
  else {

    var currencyValue = candle.close * this.lastTrade.portfolio.asset;
    var sellAmount = currencyValue - (currencyValue * (this.settings.sellFee / 100));

    log.debug("Amount to Sell", sellAmount);

    var buyAmount = this.buyPrice * this.lastTrade.portfolio.asset;

    log.debug("Amount previously bought", buyAmount);

    potentialProfitMargin = 1 - (buyAmount / sellAmount);

    log.debug("potential profit :", potentialProfitMargin, " required profit margin", profitMargin);
  }

  return potentialProfitMargin > profitMargin;
};


module.exports = method;
