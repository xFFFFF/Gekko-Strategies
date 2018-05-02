// helpers
var _ = require('lodash');
var log = require('../core/log.js');
 
// configuration
var config = require('../core/util.js').getConfig();
// let's create our own method
var method = {};
 
// prepare everything our method needs
method.init = function() {
 
  this.name = 'Scalping';
  this.currentTrend;
  this.requiredHistory = config.tradingAdvisor.historySize;
  // define the indicators we need
  var parameters = {short: 13, long: 21, signal: 1};
  this.addIndicator('macd1', 'MACD', parameters);
  var parameters = {short: 21, long: 34, signal: 1};
  this.addIndicator('macd2', 'MACD', parameters);
  var parameters = {short: 34, long: 144, signal: 1};
  this.addIndicator('macd3', 'MACD', parameters);
  this.addIndicator('ema21', 'EMA', 21);
  this.addIndicator('ema34', 'EMA', 34);
  this.addIndicator('ema144', 'EMA', 144);
   
  // initial value
  this.lastLongPrice = 0;
}
 
// what happens on every new candle?
method.update = function(candle) {
  // nothing!  
}
 
// for debugging purposes: log the last calculated
method.log = function() {
}
 
method.check = function() {
  var macd1 = this.indicators.macd1.diff; 
  var macd2 = this.indicators.macd2.diff;
  var macd3 = this.indicators.macd3.diff;
  var ema21 = this.indicators.ema21.result;
  var ema34 = this.indicators.ema34.result;
  var ema144 = this.indicators.ema144.result;
 
 
  thresholdUp = 0.0025;

  if(macd1>thresholdUp && macd2>thresholdUp && macd3>thresholdUp && ema21>ema34 && ema21>ema144) {
    this.advice('long');
    // save the long price
    this.lastLongPrice = this.candle.close;
    log.debug('buy price:', this.lastLongPrice.toFixed(8));
  } 
   
  if(macd1<thresholdUp && macd2<thresholdUp && macd3<thresholdUp && ema21<ema34 && ema21<ema144 && this.candle.close > this.lastLongPrice) {  
    this.advice('short');
  log.debug('sell price:', this.lastLongPrice.toFixed(8));
  } 
   
}
 
module.exports = method;