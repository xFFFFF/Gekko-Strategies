/*

  RSI - cykedev 14/02/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var fs = require('fs');

var EMA = require('./indicators/EMA.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'RSI';
  this.startTime = new Date();
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.rsiHistory = [];
  this.rsiLows = []
  this.rsiHighs = [];

  this.marketType = 'none'

  this.position = 0;

  this.stoploss = {
    active: 'false',
    price: 0
  };

  // Tracks rsi above/below/middle to test reentry without getting caught by moving thresholds
  this.prevRsi = 'middle';

  this.lowThreshold = 0;
  this.highThreshold = 100;

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', {
    interval: this.settings.interval
  });
  this.addIndicator('maFast', 'SMA', this.settings.SMA_short);
  this.addIndicator('maSlow', 'SMA', this.settings.SMA_long);

  //Indicators we are updating ourselves
  this.highEma = new EMA(this.settings.Threshold_Ema);
  this.lowEma = new EMA(this.settings.Threshold_Ema);

}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  var digits = 8;
  var rsi = this.indicators.rsi;

  // log.debug('calculated RSI properties for candle:');
  // log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function(candle) {
  let ind = this.indicators;
  var rsi = ind.rsi.result,
    maSlow = ind.maSlow.result,
    maFast = ind.maFast.result,
    s = this.settings;


  if (maFast > maSlow) {
    this.marketType = 'bull';
  } else {
    this.marketType = 'bear';
  }

  this.rsiHistory.push(rsi);

  if (this.rsiHistory.length < this.settings.historyLength - 1) return false;

  while (this.rsiHistory.length > this.settings.historyLength) {
    this.rsiHistory.shift();
  }

  let rsiPeaks = [];
  let rsiTroughs = [];

  let h = this.rsiHistory;

  //remove any values that are equal to the previous value - messes up below calculated

  for (let i = 0; i < h.length; i++) {
    if (h[i] = h[i + 1]) {
      h.splice(i, 1);
    }
  }


  for (let i = 1; i < h.length; i++) { //start 1 into the araray
    if (h[i - 1] < h[i] && h[i + 1] < h[i]) {
      rsiPeaks.push(h[i]);
    } else if (h[i - 1] > h[i] && h[i + 1] > h[i]) {
      rsiTroughs.push(h[i]);
    }
  }

  //now to find the max values in peaks and troughs
  rsiPeaks.sort(function(a, b) {
    return b - a
  });
  rsiTroughs.sort(function(a, b) {
    return a - b
  });

  // log.debug('Peaks: ' + rsiPeaks[0] + ', ' + rsiPeaks[1]);
  // log.debug('Troughs: ' + rsiTroughs[0] + ', ' + rsiTroughs[1]);

  //For now we will just take the 3rd peak/trough as a value. Need to immprive the selection
  // maybe mean + a stdDev
  let highUpdate, lowUpdate;



  let upperModifier = this.market === 'bull' ? s.BullMarketModifierUpper : -s.BearMarketModifierUpper;
  let lowerModifier = this.market === 'bull' ? s.BullMarketModifierLower : -s.BearMarketModifierLower;


  if (typeof rsiPeaks[2] != 'undefined') {
    //this.highEma.update(((rsiPeaks[0] + rsiPeaks[1]) / 2) + upperModifier);
    this.highEma.update(rsiPeaks[2] + upperModifier);
  }
  if (typeof rsiTroughs[2] != 'undefined') {
    // this.lowEma.update((rsiTroughs[0] + rsiTroughs[1]) / 2 + lowerModifier);
    this.lowEma.update(rsiTroughs[2] + lowerModifier);
  }



  this.highThreshold = this.highEma.result;
  this.lowThreshold = this.lowEma.result;




  /*
    if (rsi <= this.highThreshold && this.prevRsi === 'above') {
      // log.debug('Selling')
      this.short();
      this.prevRsi = 'middle';

    } else if (rsi >= this.lowThreshold && this.prevRsi === 'below') {
      // log.debug('Buying')
      this.long(candle);
      this.prevRsi = 'middle';
    } else {
      this.prevRsi = rsi > this.highThreshold ? 'above' : rsi < this.lowThreshold ? 'below' : 'middle';
    }*/

  if (rsi >= this.highThreshold && this.prevRsi === 'middle') {
    // log.debug('Selling')
    this.short();
    this.prevRsi = 'above';

  } else if (rsi <= this.lowThreshold && this.prevRsi === 'middle') {
    // log.debug('Buying')
    this.long(candle);
    this.prevRsi = 'low';
  } else {
    this.prevRsi = rsi > this.highThreshold ? 'above' : rsi < this.lowThreshold ? 'below' : 'middle';
  }

  // if (this.position === 100 && candle.close < this.stoploss.price) log.debug('Stoploss should have been triggered');

  this.checkStop(candle);

  fs.appendFile('ResultsLog/Autotune Test ' + this.startTime + '.csv', candle.high + "," + rsi + "," + this.lowThreshold + "," + this.highThreshold + "," + this.position + "\n", function(err) {
    if (err) {
      return console.log(err);
    }
  });
}

method.checkStop = function(candle) {
  if (this.stoploss.active === 'true') {
    if (candle.price > this.stoploss.price) {
      resetStoploss();
    }
  } else {
    if (this.position === 100 && candle.close < this.stoploss.price) { //bought in and price is lower than stop loss
      log.debug('Stoploss Activated')
      this.stoploss.enabled = true;
      this.advice('short');
    }
  }
}

method.resetStoploss = function() {
  this.stoploss.active = 'false';
  this.stoploss.price = 0;
}

method.long = function(candle) {
  if (this.position != 100 && this.stoploss.active === 'false') {
    this.advice('long');
    this.stoploss.price = candle.close - candle.close * (this.settings.Stoploss / 100);
    // log.debug('Bought at ' + candle.close + ' Stoploss set to ' + this.stoploss.price.toFixed(6));
    this.position = 100;
  }
}

method.short = function() {
  if (this.position != 0) {
    this.advice('short');
    this.resetStoploss();
    this.position = 0;
  }
}

module.exports = method;