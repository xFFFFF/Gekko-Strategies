var log = require('../../core/log');
var _ = require('underscore');

var Indicator = function(settings) {
  this.currentHistory = [];
  this.currentPivotHigh = null;
  this.currentPivotLow = null;

  this.candlesBeforePivot = settings.candlesBeforePivot;
  this.candlesAfterPivot = settings.candlesAfterPivot;
  // Need to add 1 to include the pivot point itself
  this.minimumHistoryNeeded = this.candlesBeforePivot + this.candlesAfterPivot + 1;
  
  this.age = 0;

  this.result = false;
}

Indicator.prototype.update = function(candle) {
  this.currentHistory.push({high: candle.high, low: candle.low});
  if(this.currentHistory.length > this.minimumHistoryNeeded) {
    this.currentHistory.shift();
  } 

  this.age++;

  if(this.age >= this.minimumHistoryNeeded) 
    this.calculate();

  return this.result;
}

Indicator.prototype.calculate = function() {
  // If 3 candles before Pivot we will studied the 4th element in the array and check if it is a max/min in the array to determine if it is a Pivot high / low
  // So if we have a candlesBeforePivot set to 3, we will need to study the 4th element of the array, which is located at the index 3
  var studiedCandle = this.currentHistory[this.candlesBeforePivot];

  var currentHistoryMaxHigh = _.max(this.currentHistory, function(candle) { return candle.high; });
  var currentHistoryMinLow = _.min(this.currentHistory, function(candle) { return candle.low; });

  var isPivotHigh = false;
  var isPivotLow = false;

  if(currentHistoryMaxHigh) {
    isPivotHigh = studiedCandle.high >= currentHistoryMaxHigh.high;
  }

  if(currentHistoryMinLow) {
    isPivotLow = studiedCandle.low <= currentHistoryMinLow.low;
  }

  var result = {isPivotHigh: isPivotHigh, pivotHighValue: studiedCandle.high, isPivotLow: isPivotLow, pivotLowValue: studiedCandle.low};

  console.log('Calculated Pivot high/low data for history:');
  console.log('\t', this.currentHistory);
  //console.log('\t', result)

  this.result = result;
}

module.exports = Indicator;