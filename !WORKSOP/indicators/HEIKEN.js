// required indicators
var SMMA = require('./SMMA.js');

var Indicator = function (settings) {
  this.input = 'candle';
  this.lastClose = null;
  this.weight = settings.interval;
  this.avgU = new SMMA(this.weight);
  this.avgD = new SMMA(this.weight);
  this.u = 0;
  this.d = 0;
  this.rs = 0;
  this.result = 0;
  this.age = 0;
}

// Calculation of Heiken-Ashi

// 1. The Heikin-Ashi Close is simply an average of the open, 
// high, low and close for the current period. 

// <b>HA-Close = (Open(0) + High(0) + Low(0) + Close(0)) / 4</b>

// 2. The Heikin-Ashi Open is the average of the prior Heikin-Ashi 
// candlestick open plus the close of the prior Heikin-Ashi candlestick. 

// <b>HA-Open = (HA-Open(-1) + HA-Close(-1)) / 2</b> 

// 3. The Heikin-Ashi High is the maximum of three data points: 
// the current period's high, the current Heikin-Ashi 
// candlestick open or the current Heikin-Ashi candlestick close. 

// <b>HA-High = Maximum of the High(0), HA-Open(0) or HA-Close(0) </b>

// 4. The Heikin-Ashi low is the minimum of three data points: 
// the current period's low, the current Heikin-Ashi 
// candlestick open or the current Heikin-Ashi candlestick close.

// <b>HA-Low = Minimum of the Low(0), HA-Open(0) or HA-Close(0) </b>

var calculateHeikin = function(previous, current) {
  // your magic
}


method.update = function(candle) {

} 



Indicator.prototype.update = function (candle) {
  var currentClose = candle.close;

  if(this.previousCandle) {
    var heikin = calculateHeikin(this.previousCandle, candle);

    // do something with heikin
  }

  this.previousCandle = candle;


}

module.exports = Indicator;
