// Let's create our own buy and sell strategy
var _ = require('lodash');
var log = require('../core/log.js');
var strat = {};


// Prepare everything our strat needs
strat.init = function() {
  this.lineare = 0;
  this.name = 'adosc-fab';
  this.requiredHistory = this.tradingAdvisor.historySize;
  this.historycdl = [];
  this.historyadosc = [];
  this.historytrix = [];
  this.historymacd = [];

//  this.trend = 'none';
  this.requiredHistory = 34;
  var myadoscSettings = this.settings.parameters1;
  var mytrixSettings = this.settings.parameters2;
  var mymacdSettings = this.settings.parameters3;
  this.addTulipIndicator('myadosc', 'adosc', myadoscSettings);
  this.addTulipIndicator('mytrix', 'trix', mytrixSettings);
  this.addTulipIndicator('mymacd', 'macd', mymacdSettings);
}

// What happens on every new candle?
strat.update = function(candle) {

}

// For debugging purposes.
strat.log = function() {
}

//
strat.check = function(candle) {
  this.historycdl.unshift(candle.close);
  //this.historyadosc.unshift(this.tulipIndicators.myadosc.result.result);
  var rtrix = this.tulipIndicators.mytrix.result.result;
  var trixdiff = rtrix;
  var rmacd = this.tulipIndicators.mymacd.result;
  var macddiff = rmacd['macd'] - rmacd['macdSignal'];

  console.log(
  //  chiuso + " " +
      this.historycdl[0] + " " +
  //    this.historyadosc[0] + " " +
  //    this.historytrix[0] + " " +
      trixdiff + " " +
      macddiff + " " +
  " ");

}

module.exports = strat;
