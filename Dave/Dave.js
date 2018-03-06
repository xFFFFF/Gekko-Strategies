/*

  MACD - DJM 31/12/2013

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.boughtAt = 0;
  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('dave', 'Dave', this.settings);
  this.boughtPriceCount = 0;
  this.maxExposureCount = 0;
}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!  
}

method.check = function() {
  
  //If long short average / long average < 1.00 then we have a dip
  var shortAverage = this.indicators.dave.short.result;
  var longAverage = this.indicators.dave.long.result;
  var lastPrice = this.indicators.dave.lastPrice;
  var change = shortAverage/longAverage;
  var priceCountDiff = this.indicators.dave.priceCount - this.boughtPriceCount;
  
  var maxExposureHitCountDiff = this.indicators.dave.priceCount - this.maxExposureCount;
  var weHitMaxExposure = this.maxExposureCount > 0;
  
  if( this.boughtAt > 0 ){
    var change = lastPrice / this.boughtAt;
  // 
  // if last price / buy price > 1.00 then we have a lift
  // lift size is  last_price / buy_price - 1.00
  // if lift_size > threshold to sell
  // then sell and mark that we are out
    var dipSize = 1.0 - change;
    var liftSize = change - 1.0;
    
    if( change > 1.0 ){
      log.debug("*******","We have lift",shortAverage.toFixed(4),longAverage.toFixed(4),liftSize.toFixed(8));
            
      if(liftSize > this.settings.thresholds.up){
        this.advice('short');
        log.debug("******",'We sold',lastPrice);
        this.boughtAt = 0;
        this.maxExposureCount = 0;
      } 
    } else if( dipSize > 0 ){
      if( dipSize > this.settings.thresholds.getOut ){
        log.debug("*******","Get Out!",shortAverage.toFixed(4),longAverage.toFixed(4),dipSize.toFixed(8));        
        this.advice('short');
        this.boughtAt = 0;
        //this.maxExposureCount = this.indicators.dave.priceCount;
      }
    } 
    
    if( this.boughtAt > 0 && priceCountDiff > this.settings.thresholds.maxExposureLength){
      this.advice('short');
      this.boughtAt = 0;
      //this.maxExposureCount = this.indicators.dave.priceCount;
    }
  } else if( change < 1.0 ){
    // dip size is 1 - above 
    var dipSize = 1.0 - change;
    log.debug("*******","We have a dip",shortAverage.toFixed(4),longAverage.toFixed(4),dipSize.toFixed(8));
    
  // if dip size is greater than threshold to buy
    if( weHitMaxExposure && maxExposureHitCountDiff < this.settings.thresholds.maxExposureLength){
      log.debug("******","Skipping any buy because we just hit a max exposure");
      this.advice();
      return;
    }
    
    if( dipSize > this.settings.thresholds.down ){
      // then buy and save the price  to buy price and mark that we bought
      this.advice('long'); 
      this.boughtAt = lastPrice; 
      this.boughtPriceCount = this.indicators.dave.priceCount;
      log.debug('\n','*****************',"We bought", lastPrice, this.boughtPriceCount,'\n');
      this.maxExposureCount = 0;
    }
  } else {

    //log.debug('In no trend');

    // we're not in an up nor in a downtrend
    // but for now we ignore sideways trends
    //
    // read more @link:
    //
    // https://github.com/askmike/gekko/issues/171

    // this.trend = {
    //   direction: 'none',
    //   duration: 0,
    //   persisted: false,
    //   adviced: false
    // };

    this.advice();
  }
}

module.exports = method;
