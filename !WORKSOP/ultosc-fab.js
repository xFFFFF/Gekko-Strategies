// Let's create our own buy and sell strategy
var _ = require('lodash');
var log = require('../core/log.js');
var strat = {};


// Prepare everything our strat needs
strat.init = function() {
  this.lineare = 0;
  this.name = 'ultosc';

//  this.trend = 'none';
  //this.requiredHistory = this.settings.storia;
  var myultoscslowSettings = this.settings.parameters1;
  var myultoscfastSettings = this.settings.parameters2;
  this.addTulipIndicator('myultoscslow', 'ultosc', myultoscslowSettings);
  this.addTulipIndicator('myultoscfast', 'ultosc', myultoscfastSettings);
}

// What happens on every new candle?
strat.update = function(candle) {

}

// For debugging purposes.
strat.log = function() {
  if (this.lineare = 0){
    console.log("cl ao ad emv bop avgprice marketfi obv");
    this.lineare++;
  }

}

//
strat.check = function(candle) {
  var chiuso = this.candle.close;
  var rultoscslow = this.tulipIndicators.myultoscslow.result.result;
  var rultoscfast = this.tulipIndicators.myultoscfast.result.result;


  console.log(
    chiuso + " " +
    rultoscslow + " " +
    rultoscfast + " " +
  " ");
}

module.exports = strat;
