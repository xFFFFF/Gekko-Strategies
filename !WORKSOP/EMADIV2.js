// Source: https://raw.githubusercontent.com/imperator6/gekko/stable/strategies/EMADIV2.js
// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.EMADIV2;

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'EMADIV2';

  this.currentTrend;
  this.requiredHistory = config.tradingAdvisor.historySize;

  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = {
        type: 'long',
        duration: 0,
        prevCandle: null,
  };

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
    log.debug('we are currently in downtrend', message);

    if(this.trend.type !== 'long') {
      // set trend to long
      this.trend = {
        type: 'long',
        duration: 0,
        prevCandle: null,
      };
    }
    
    this.trend.duration++;
    
    if(this.trend.prevCandle !== null) {
        if(candle.close <= this.trend.prevCandle.close) {
              // wait for the next candle
              log.debug('still in downtrend. lets wait for the next candle', message);
              this.advice();
        } else {
            this.advice('long');
        }

    } else
      this.advice();
    
    this.trend.prevCandle = _.clone(candle);

  } else if(diff >= settings.short) {
    log.debug('we are currently in a uptrend', message);

    if(this.trend.type !== 'short') {
      // set trend to long
      this.trend = {
        type: 'short',
        duration: 0,
        prevCandle: null,
      };
    }
    
    this.trend.duration++;

    if(this.trend.prevCandle !== null) {
        if(candle.close >= this.trend.prevCandle.close) {
              // wait for the next candle
              log.debug('still in uptrend. lets wait for the next candle', message);
              this.advice();
      } else {
            this.advice('short');
      }

    } else
      this.advice();

    this.trend.prevCandle = _.clone(candle);
   
  } else {
    log.debug('we are currently not in an up or down trend', message);
    this.advice();
    
    // reset the trend
    this.trend = {
       type: 'none',
        duration: 0,
        prevCandle: null,
    };
  }
}

module.exports = method;
