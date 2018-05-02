/*

  Custom Strategy - 
    BUY: RSI < 20 and MACD < 0 and BB < lowband
    SELL: RSI > 80 or (MACD crosses back below 0 and BB < midband)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// indicators
var rsi = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'Amits Winning Strategy';

  // no investment to start with
  this.currentTrend = 'short'
  this.macdPositive = false;
  this.bbTrendingPositive = false;
  this.currentBuyRate = 0;

  // keep state about the current market trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false
  };

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', { interval: 10 });
  this.addIndicator('macd', 'MACD', { short: 10, long: 21, signal: 9});
  this.addTalibIndicator('my_bbands', 'bbands', { optInTimePeriod: 20, optInNbStdDevs: 2, optInNbDevUp: 2, optInNbDevDn: 2, optInMAType: 0});
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  var digits = 8;
  var macd = this.indicators.macd;
  var rsiValue = this.indicators.rsi.result;
  var macdValue = macd.diff;

  var bbandsLower   = this.talibIndicators.my_bbands.result.outRealLowerBand;
  var bbandsMiddle  = this.talibIndicators.my_bbands.result.outRealMiddleBand;
  var bbandsUpper   = this.talibIndicators.my_bbands.result.outRealUpperBand;

  log.debug(
    "Close: " + this.candle.close,
    "RSI: " + rsiValue,
    "MACD: " + macdValue,
    "BB_L: " + bbandsLower,
    "BB_M: " + bbandsMiddle,
    "BB_U: " + bbandsUpper
  )

  /*
  var signal = macd.signal.result;
  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'short:', macd.short.result.toFixed(digits));
  log.debug('\t', 'long:', macd.long.result.toFixed(digits));
  log.debug('\t', 'macd:', macdValue.toFixed(digits));
  log.debug('\t', 'signal:', signal.toFixed(digits));
  log.debug('\t', 'macdiff:', macd.result.toFixed(digits));
  */
}

method.check = function(candle) {
  // test rsi levels
  var rsiValue = this.indicators.rsi.result
  var rsiSaysBuy = false;
  var rsiSaysSell = false;

  // test macd trends
  var macddiff = this.indicators.macd.diff;
  var macdPositive = false;
  var macdSaysBuy = false;
  var macdSaysSell = false;

  // test bollinger bands
  var bbl   = this.talibIndicators.my_bbands.result.outRealLowerBand;
  var bbm   = this.talibIndicators.my_bbands.result.outRealLowerBand;
  var bbu   = this.talibIndicators.my_bbands.result.outRealLowerBand;
  var bbSaysBuy = false;
  var bbSaysSell = false;

  // test stoploss
  var stoplossSaysSell = false;


  rsiSaysBuy = rsiValue < 20;
  rsiSaysSell = rsiValue > 80;

  // macd neg so good time to buy
  var macdSaysBuy = macddiff < -2; 
  // macd just switched to strong neg from a positive trend, so get out of it.
  var macdSaysSell = this.macdPositive && macddiff < -1; 

  var bbSaysBuy = candle.close < bbl;
  // just crossed the bbm line in a downward direction (need to make this recently went downward instead)
  var bbSaysSell = candle.close < bbm;

  // sell if drops more than X% (stop loss limit)
  if (candle.close < (this.currentBuyRate * 0.90)){
    stoplossSaysSell = true;
  }
 
  
  // update the macdPositive value 
  this.macdPositive = macddiff > 0;

  // update the bb trend direction
  this.bbTrendingPositive = candle.close > bbm
  
  if(this.currentTrend === 'long') {
    // maybe we need to advice short now?

    // only if RSI and MACD and BB say so:
    if((macdSaysSell || stoplossSaysSell)) {
      log.debug("SELL!")
      log.debug("rsi: " + rsiSaysSell, "|| (macd:" + macdSaysSell, "&& bb:" + bbSaysSell + ")")
      this.currentTrend = 'short';
      this.advice('short')
    }
  } 
  else if(this.currentTrend === 'short') {
    // maybe we need to advice long now?

    // only if RSI, MACD, and BB say so:
    // note: just cos its oversold doesnt mean it wont keep dropping
    // this strat works in an uptrend market.
    //  - need another signal here to wait longer in a downtrend market.
    if(rsiSaysBuy && macdSaysBuy && bbSaysBuy) {
      log.debug("BUY!")
      log.debug("rsi: " + rsiSaysBuy, "&& macd:" + macdSaysBuy, " && bb:" + bbSaysBuy, "")
      this.currentBuyRate = candle.close;
      this.currentTrend = 'long';
      this.advice('long')
    }
  }
}


module.exports = method;
