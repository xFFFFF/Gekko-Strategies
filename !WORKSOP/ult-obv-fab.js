// Let's create our own buy and sell strategy
var _ = require('lodash');
var log = require('../core/log.js');
var strat = {};


// Prepare everything our strat needs
strat.init = function() {
  this.lineare = 0;
  this.name = 'ult-obv-fab';

  this.historycdl = [];
  this.historyultosc = [];
  this.historyobv = [];

//  this.trend = 'none';
  this.requiredHistory = 34;
  var myultoscSettings = this.settings.parameters1;
  this.addTulipIndicator('myultosc', 'ultosc', myultoscSettings);
  this.addTulipIndicator('myobv', 'obv', '');
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
  var rultosc = 0.5;
  var robv = 0;
  this.historycdl.unshift(candle.close);
  this.historyultosc.unshift(this.tulipIndicators.myultosc.result.result);
  this.historyobv.unshift(this.tulipIndicators.myobv.result.result);

//if di ultosc
  if (this.historyultosc[0]<30){
    rultosc = 0
  }
  if (this.historyultosc[0]>60){
    rultosc = 1
  }

//if di robv
  if ((this.historyobv[3]+this.historyobv[2]+this.historyobv[1])<1.2*this.historyobv[0]) {
    robv = 1;
  }


  console.log(
  //  chiuso + " " +
      this.historycdl[0] + " " +
      this.historyultosc[0] + " " +
      this.historyobv[0] + " " +
      rultosc + " " +
      robv + " " +
  " ");

}

module.exports = strat;
