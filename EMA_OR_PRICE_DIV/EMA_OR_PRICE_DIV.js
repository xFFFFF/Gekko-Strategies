// Source: https://raw.githubusercontent.com/imperator6/gekko/stable/strategies/EMA_OR_PRICE_DIV.js
// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.EMA_OR_PRICE_DIV;

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'EMA_OR_PRICE_DIV';

  this.currentTrend;
  this.requiredHistory = config.tradingAdvisor.historySize;

  this.longPrice = -1;
  this.shortPrice = -1;

  this.price = -1;

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
  log.debug('\t EMA age:', ema.age, 'candles');
}

method.adviceWrapper = function(arg) {

  if(this.longPrice > -1 && 'short' === arg) {

    this.advice(arg);

  } else if (this.shortPrice > -1 && 'long' === arg) {

        var goodLongPrice = this.shortPrice  - (this.shortPrice* 0.025);

        if(this.price < goodLongPrice ) { // TODO less than x percent
          this.advice('long');
        } else {
          log.info('LOSS protection!!!! Current Price ' + this.price + ' is higher than short price of ' + this.shortPrice )
          this.currentTrend = 'down'
          this.advice();
        }
  } else {
    this.advice(arg);
  }

};




method.check = function(candle) {
  var ema = this.indicators.ema;
  var avgPrice = ema.result;
  var price = candle.close;

  this.price = price;

  // 1. check the current price for quick money
  if(this.currentTrend === 'up' && this.longPrice > -1) {

    var longDiff = (price/this.longPrice*100)-100;

    if(longDiff >= (settings.short + Math.abs(settings.long))) {
        var message = '@ ' + price.toFixed(8) + ' ( longPrice:' + this.longPrice.toFixed(5) + ' diff:' + longDiff + ')';
        log.debug('QuickMoney: going short! ', message);
        this.currentTrend = 'down';
        this.shortPrice = price;
        //this.longPrice = -1;
        this.adviceWrapper('short');
        return;
    }

  } else if(this.currentTrend === 'down' && this.shortPrice > -1) {

      var shortDiff = (price/this.shortPrice*100)-100;

      if(shortDiff <= (settings.long - settings.short)) {
          var message = '@ ' + price.toFixed(8) + ' ( shortPrice:' + this.shortPrice.toFixed(5) + ' diff:' + shortDiff + ')';
          log.debug('QuickMoney: going long! ', message);
          this.currentTrend = 'up';
          this.longPrice = price;
        //  this.shortPrice = -1;
          this.adviceWrapper('long');
          return;
      }
  }


  // 2. check long ema diff against the current price
    var diff = (price/avgPrice*100)-100;

    var message = '@ ' + price.toFixed(8) + ' ( avgPrice:' + avgPrice.toFixed(5) + ' diff:' + diff + ')';

  if(diff <= settings.long) {


    if(this.currentTrend !== 'up') {
      log.debug('New Advice LONG!', message);
      this.currentTrend = 'up';
      this.longPrice = price;
      //this.shortPrice = -1;
      this.adviceWrapper('long');
    } else {
      log.debug('EMA_OR_PRICE_DIFF values:', message);
      this.adviceWrapper();
    }


  } else if(diff >= settings.short) {

    if(this.currentTrend !== 'down') {
      log.debug('New Advice SHORT!', message);
      this.currentTrend = 'down';
      this.shortPrice = price;
      //this.longPrice = -1;
      this.adviceWrapper('short');
    } else {
      log.debug('EMA_OR_PRICE_DIFF values:', message);
      this.adviceWrapper();
    }

  } else {
    log.debug('EMA_OR_PRICE_DIFF values:', message);
    this.adviceWrapper();
  }
}

module.exports = method;
