var _ = require('lodash');
var log = require('../core/log.js');

// Let's create our own buy and sell strategy
var strat = {};

// Prepare everything our strat needs
strat.init = function() {
  this.priceclose = [];
  this.AOres = []; //array contenente lo storico di AO
  this.addTulipIndicator('myAO', 'ao', "");
//inserisco un altro indicatore
  this.ADOSCres = [];
  var customADOSCSettings = this.settings.parameters;
  this.addTulipIndicator('myADOSC', 'hma', customADOSCSettings);
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
  this.AOres.unshift(this.tulipIndicators.myAO.result.result);
  this.ADOSCres.unshift(5+this.tulipIndicators.myADOSC.result.result);

  if (this.priceclose.length > 34) {
    this.priceclose.pop();
    this.AOres.pop();
  }

  if ((this.ADOSCres[0] > this.ADOSCres[1]) && (this.AOres[0] > this.AOres[1])){
    this.advice('long');
    this.ADOScompra = 1;

  }
  if ((this.ADOSCres[0] < this.ADOSCres[1]) && (this.AOres[0] < this.AOres[1])){
    this.advice('short');
    this.ADOScompra = 0;

  }

  console.log(
    this.priceclose[0] + " " +
    this.AOres[0] + " " +
    this.ADOSCres[0] + " " +
    this.ADOScompra + " " +
  " ");
  return;
}

module.exports = strat;
