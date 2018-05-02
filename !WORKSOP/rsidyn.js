var _ = require('lodash');
var log = require('../core/log.js');
var math = require('mathjs');

var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};
var LowList = [];
var lowpeak = [];
var HighList = [];
var highpeak = [];
var bought = false;

// prepare everything our method needs
method.init = function(candle) {
  bought = false;
  sellat = this.settings.sellat;
  buyat = this.settings.buyat;
  stop_percent = this.settings.stop_percent;
  stop_enabled = this.settings.stop_enabled;

  this.stopped = {
    duration: 0,
    triggered: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', this.settings);
}

method.update = function(candle){
  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  if(rsiVal > 60){
    HighList.push(rsiVal);
    
  }else if(rsiVal < 30){
    LowList.push(rsiVal);   
  }

  if(HighList.length > 10){HighList.shift()}
  if(LowList.length > 10){LowList.shift()}

}

method.log = function(candle) {

}

method.check = function(candle) {
  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  if(this.stop < (candle.close * stop_percent)){
    this.stop = candle.close * stop_percent;
 };

 if(this.stopped.duration < 10 && this.stopped.triggered === true){
   this.stopped.duration++;
 }else{
   this.stopped.triggered = false;
   this.stopped.duration = 0;
  };

  if(LowList.length > 2){
    lowmedian = math.mean(LowList);
  }else var lowmedian = 30;
   if(HighList.length > 2){
      highmedian = math.mean(HighList);
   }else var highmedian = 70;
 
   if(rsiVal < lowmedian){
     lowpeak.push((lowmedian - rsiVal) * buyat);
     if(lowpeak.lengt > 5){lowpeak.shift()}
   } 
   if(lowpeak.length > 2){
   lowpeak1 = math.mean(lowpeak);
   }else lowpeak1 = 0;
 
   if(rsiVal > highmedian){
     highpeak.push((rsiVal - highmedian) * sellat);
     if(highpeak.lengt > 5){highpeak.shift()}
   } 
   if(highpeak.length > 2){
   highpeak1 = math.mean(highpeak);
   }else highpeak1 = 0;

   if(this.stopped.triggered == false){
      if(rsiVal > highmedian + highpeak1 && bought) {
         bought = false;
         this.advice('short');
         console.log('rsival:\t\t\t',rsiVal);
         console.log('selling at this rsival:\t',highmedian + highpeak1);
         console.log(' ')

      } else if(rsiVal < lowmedian - lowpeak1 && bought == false) {
         bought = true;
         this.advice('long');
         buyprice = candle.close;
         this.stop = candle.close * stop_percent;
         console.log('rsival:\t\t\t',rsiVal);
         console.log('buying at this rsival:\t',lowmedian - lowpeak1);
         console.log(' ');

      } else if(stop_enabled){
         if(candle.close < this.stop && bought){
         loss = (candle.close - buyprice)/buyprice*100;
         console.log('stop loss triggered loss:', loss);
         bought = false;
         this.stopped.triggered = true;
         this.advice('short');
         } 
      }
    }
}

module.exports = method;
