
var _ = require('lodash');
var log = require('../core/log.js');
// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'TEMA';

  this.requiredHistory = this.tradingAdvisor.historySize;
  this.addIndicator('realPrice', 'MOMENTUM', 24);
  this.prices = [];
  this.upPrice = 0;
  this.endOperations = false;

  this.advice('short');
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  // console.log(candle);
}

method.getLowInDay = function () {
  let count = 24;
  let lowPrice = 1000000000;

  for (var i = count; i >= 0; i--) {
    number = this.prices[(this.prices.length)-i];
    if(number<lowPrice) {
      lowPrice = number;
     }
  }
  return lowPrice;
}

method.check = function() {
  // console.log(this.indicators);
  if(this.endOperations==true) {
    return;
  }
  data = this.indicators;
  this.prices.push(data.realPrice.result);
  console.log(this.getLowInDay());

  // Script de achar  a Alta
  if((data.realPrice.result) > 1.5*(this.getLowInDay())) {
    this.advice('long');
    
    this.upPrice = data.realPrice.result;
    if(this.upPrice < data.realPrice.result) {
      this.upPrice = data.realPrice.result;
    }
  }
  

  // Script de achar a Baixa
  if((data.realPrice.result) < 0.85 * (this.upPrice)) {
    this.advice('short');
    this.upPrice = 0;
    this.endOperations = true;
  }

}


module.exports = method;
