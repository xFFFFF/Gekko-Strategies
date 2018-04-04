// Source: https://raw.githubusercontent.com/imperator6/gekko/stable/strategies/EMADIV.js
// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.EMADIV;

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'EMADIV';

  this.currentTrend;
  this.requiredHistory = config.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('ema', 'EMA', settings.ema);
}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  var ema = this.indicators.ema;
  log.debug('calculated EMA properties for candle:');
  log.debug('\t', 'ema:', ema.result.toFixed(8));
  log.debug('\t DEMA age:', ema.age, 'candles');
}

method.check = function(candle) {
  var ema = this.indicators.ema;
  var avgPrice = ema.result;
  var price = candle.close;

  var diff = (price/avgPrice*100)-100;

  var message = '@ ' + price.toFixed(8) + ' ( avgPrice:' + avgPrice.toFixed(5) + ' diff:' + diff + ')';
  
  console.log(message);
  if(diff <= settings.long) {
    log.debug('we are currently in uptrend', message);

    if(this.currentTrend !== 'up') {
      this.currentTrend = 'up';
      this.advice('long');
    } else
      this.advice();

  } else if(diff >= settings.short) {
    log.debug('we are currently in a downtrend', message);

    if(this.currentTrend !== 'down') {
      this.currentTrend = 'down';
      this.advice('short');
    } else
      this.advice();

  } else {
    log.debug('we are currently not in an up or down trend', message);
    this.advice();
  }
}

module.exports = method;
