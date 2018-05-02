const log = require('../../core/log');

var Indicator = function(lossPercent) {
  this.input = 'candle';
  this.lastHighPrice = 0;
  this.lastBuyPrice = 0;
  this.shouldSell = false;
  this.lossPercent = lossPercent;
  this.timesStopped = 0;
}

Indicator.prototype.update = function(candle) {

  if(candle.high > this.lastHighPrice)
  {
      this.lastHighPrice = candle.high;
      this.shouldSell = false;
  }
  const stopPrice = this.lastHighPrice * ((100 - this.lossPercent) / 100);
  if(this.previousAction == 'buy' && candle.close < stopPrice)
  {
    this.timesStopped++;
    this.shouldSell = true;
    log.debug("StopLoss Triggered: " + this.timesStopped);
    log.debug("Last buy price: " + this.lastBuyPrice, " Last high price: " + this.lastHighPrice);
    const actualPercentChanged = (candle.close - this.lastBuyPrice) / this.lastBuyPrice * 100;
    log.debug("Current Price: " + candle.close, " Actual percent changed from buy: " +  actualPercentChanged);
    this.lastHighPrice = 0;
    this.lastBuyPrice = 0;
  }
  
}
Indicator.prototype.long = function(price){
  this.previousAction = 'buy';
  this.lastBuyPrice = price;
  this.lastHighPrice = price;
  this.shouldSell = false;
}
Indicator.prototype.short = function(price){
  this.previousAction = 'sell';
  this.shouldSell = false;
}
module.exports = Indicator;
