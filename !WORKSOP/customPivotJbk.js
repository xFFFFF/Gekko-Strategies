// If you want to use your own trading methods you can
// write them here. For more information on everything you
// can use please refer to this document:
// 
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md
// 
// The example below is pretty stupid: on every new candle there is
// a 10% chance it will recommand to change your position (to either
// long or short).

var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.customPivotJbk;

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.currentTrend = 'long';

  this.requiredHistory = settings.candlesBeforePivot + settings.candlesAfterPivot;

  this.stopLossPercents = settings.stopLossPercents / 100;
  this.takeProfitPercents = settings.takeProfitPercents /100;

  // define the indicators we need
  this.addIndicator('pivotHighLow', 'PIVOTHIGHLOW', settings);
}

// What happens on every new candle?
strat.update = function(candle) {
 // nothing!
}

// For debugging purposes.
strat.log = function() {
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {

  // Only continue if we have a new update.
  var pivotHighLowData = this.indicators.pivotHighLow.result;

  console.log('pivotHighLowData:');
  console.log('\t', pivotHighLowData);

  if(pivotHighLowData.isPivotHigh) {
    let pivotHighValue = pivotHighLowData.pivotHighValue;

    console.log('*****Going Long******');
    this.advice('long', {
      longEntryStopLossPrice: pivotHighValue + pivotHighValue * this.stopLossPercents,
      longEntryTakeProfitPrice: pivotHighValue + pivotHighValue * this.takeProfitPercents
    });
  } 

  if(pivotHighLowData.isPivotLow) {
    let pivotLowValue = pivotHighLowData.pivotLowValue;

    console.log('******Going short*****')
    this.advice('short', {
      shortEntryStopLossPrice: pivotLowValue + pivotLowValue * this.stopLossPercents,
      shortEntryTakeProfitPrice: pivotLowValue + pivotLowValue * this.takeProfitPercents
    });
  }

}

module.exports = strat;