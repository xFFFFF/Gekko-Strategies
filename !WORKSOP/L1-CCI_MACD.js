// Let's create our own strategy
var strat = {};

var parameters = {
  short: 12,
  long: 26,
  signal: 9,
  down: -0.0001,
  up: 0.005,
  persistence: 1
};

var parameters1 = {
  interval: 14,
  low: 30,
  high: 70,
  persistence: 2
};

var parameters2 = {
  constant: 0.015,
  history: 90,
  up: 100,
  down: -100,
  persistence: 0
};

// Prepare everything our strat needs
strat.init = function () {
  // start of with no investment
  this.currentTrend = 'short';
  // your code!
  // add a native MACD

  this.addIndicator('mynativemacd', 'MACD', parameters);
  //add native RSI

  //  this.addIndicator('mynativeRSI', 'RSI', parameters1);
  //add native CCI

  this.addIndicator('mynativeCCI', 'CCI', parameters2);

}

// What happens on every new candle?
strat.update = function (candle) {
  // your code!
}

// For debugging purposes.
strat.log = function () {
  // your code!

}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function () {
  // your code!
  //setting vars for MACD results
  var MACD = this.indicators;
  console.log("MACD:");
  console.log(this.indicators.mynativemacd);

  var MACDsaysBUY = parameters.down < -0.0001;
  var MACDsaysSELL = parameters.up > 0.005;
  // setting vars for RSI results
  //  var RSI = this.indicators.mynativeRSI.rsi;
  //  var RSIsaysBUY = RSI > parameters1.high;
  //  var RSIsaysSELL = RSI < parameters1.low;
  // setting vars for CCI results
  var CCI = this.indicators.mynativeCCI.cci;
  var CCIsaysBUY = parameters2.down < -100;
  var CCIsaysSELL = parameters2.down > 100;
  /// Setting conditions

  if (this.currentTrend === 'long') {

    // maybe we need to advice short now?

    // only if BOTH MACD and RSI and CCI say so:
    if (MACDsaysSELL && CCIsaysSELL) {
      //  if (MACDsaysSELL && RSIsaysSELL && CCIsaysSELL) {
      this.currentTrend = 'short';
      this.advice('short')
    }

  } else if (this.currentTrend === 'short') {

    // maybe we need to advice long now?

    // only if BOTH MACD and RSI and CCI say so:
    //  if (MACDsaysBUY && RSIsaysBUY && CCIsaysBUY) {        
    if (MACDsaysBUY && CCIsaysBUY) {
      this.currentTrend = 'long';
      this.advice('long')
    }
    else {
      this.advice();
    }
  }
}

module.exports = strat;