var _ = require('lodash');
var log = require('../core/log.js');

// Let's create our own buy and sell strategy
var strat = {};

// Prepare everything our strat needs
strat.init = function() {
  this.priceclose = [];
//inserisco HMA
  this.HMAres = [];
  var customHMASettings = this.settings.parameters1;
  this.addTulipIndicator('myHMA', 'hma', customHMASettings);
//inserisco altro indicatore
  this.OTHERres = []; //array contenente lo storico di AO
  var customOTHERSettings = this.settings.parameters2;
  this.addTulipIndicator('myOTHER', 'trix', customOTHERSettings);
  return;
}

// What happens on every new candle?
strat.update = function(candle) {
}

// For debugging purposes.
strat.log = function() {
}

//
strat.check = function(candle) {
  this.priceclose.unshift(candle.close);
  this.HMAres.unshift(5+this.tulipIndicators.myHMA.result.result);
  this.OTHERres.unshift(10000+this.tulipIndicators.myOTHER.result.result);

  if (this.priceclose.length > 34) {
    this.priceclose.pop();
    this.HMAres.pop();
  }
//if gestione hma
  if ((this.HMAres[0] > this.HMAres[1])) {
    this.trend = 'long';
  }
  if ((this.HMAres[0] < this.HMAres[1])) {
    this.trend = 'short';
  }
  //if gestione other
  if (this.OTHERres[0] > this.OTHERres[1]){
    this.trendother = 'long';
  }
  if (this.OTHERres[0] < this.OTHERres[1]){
    this.trendother = 'short';
  }

//if stoploss
  if (this.priceclose[0] < (this.buyprice * 0.97)) {
    this.stoploss = 1;
  }
//take profit
  else if (this.priceclose[0] < (this.buyprice * 1.02)) {
    this.trend = 'none';
    this.trendother = 'none';
  }
  // controllo prezzo buy 0
  else if (this.priceclose[0])

  //if acquisto vendita
  if ((this.trend == 'long') && (this.trendother == 'long')){
    this.advice(this.trend);
    this.position = 1;
    this.buyprice = this.priceclose[0];
    this.stoploss = 0;
  }
  if ((this.trend == 'short') || (this.trendother == 'short') || (this.stoploss == 1)){
    this.advice(this.trend);
    this.position = 0;
    this.stoploss = 0;
    this.buyprice = 0;
  }


  console.log(
    this.priceclose[0] + " " +
    this.HMAres[0] + " " +
    this.OTHERres[0] + " " +
    this.position + " " +
  " ");
  return;
}

module.exports = strat;
