// Let's create our own buy and sell strategy
var strat = {};

// Prepare everything our strat needs
strat.init = function() {
  this.linea = 0;
  this.name = 'misto';

//  this.trend = 'none';
  this.requiredHistory = 34;
  this.addTulipIndicator('myao', 'ao', "");
  this.addTulipIndicator('myad', 'ad', "");
  this.addTulipIndicator('mybop', 'bop', "");
  //this.addTulipIndicator('myemv', 'emv', "");
  this.addTulipIndicator('myavgprice', 'avgprice', "");
  this.addTulipIndicator('mymarketfi', 'marketfi', "");
  this.addTulipIndicator('myobv', 'obv', "");
}

// What happens on every new candle?
strat.update = function(candle) {

}

// For debugging purposes.
strat.log = function() {
  if (this.linea = 0){
    console.log("cl ao ad emv bop avgprice marketfi obv");
    this.linea = this.linea +1;
  }

}

//
strat.check = function(candle) {
  var chiuso = candle.close;
  var rao = this.tulipIndicators.myao.result.result;
  var rad = Math.floor(this.tulipIndicators.myad.result.result);
  var rbop = this.tulipIndicators.mybop.result.result;
  //var remv = Math.floor(this.tulipIndicators.myemv.result.result);
  var ravgprice = Math.floor(this.tulipIndicators.myavgprice.result.result);
  var rmarketfi = this.tulipIndicators.mymarketfi.result.result;
  var robv = Math.floor(this.tulipIndicators.myobv.result.result);


  console.log(
    chiuso + " " +
    rao + " " +
    rad + " " +
    rbop + " " +
    //remv + " " +
    ravgprice + " " +
    rmarketfi + " " +
    robv + " " +
  " ");
}

module.exports = strat;
