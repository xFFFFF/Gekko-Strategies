/*

  MACD - DJM 31/12/2013

  (updated a couple of times since, check git history)

 */




// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var twilio = require('twilio');

// Find your account sid and auth token in your Twilio account Console.
var client = new twilio('AC66b852cbd008a679f3fed5c8459fb9dc', 'de9a3447057bb658a05536a1cc9ac0c3');

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

  this.mfi = {
      result: 0,
      overbought: 'overbought',
      oversold: 'oversold',
  };



  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('macd', 'MACD', this.settings.macd_settings);
  this.addTulipIndicator('_mfi', 'mfi', this.settings.mfi_settings);
  this.addTulipIndicator('_adx', 'adx', this.settings.adx_settings);
  
}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
  this.mfi = this.tulipIndicators._mfi.result.result;
  this.adx = this.tulipIndicators._adx.result.result;

}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  var digits = 8;
  var macd = this.indicators.macd;
  var mfi = (this.mfi) ? this.mfi : 0;

  var diff = macd.diff;
  var signal = macd.signal.result;

  log.debug('calculated ADX properties for candle:');  
  log.debug('\t', 'adx:', this.adx, '\n');

  log.debug('calculated MFI properties for candle:');  
  log.debug('\t', 'mfi:', mfi.toFixed(digits), '\n');

  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'short:', macd.short.result.toFixed(digits));
  log.debug('\t', 'long:', macd.long.result.toFixed(digits));
  log.debug('\t', 'macd:', diff.toFixed(digits));
  log.debug('\t', 'signal:', signal.toFixed(digits));
  log.debug('\t', 'macdiff:', macd.result.toFixed(digits), '\n');
}


method.check = function() {
  var macddiff = this.indicators.macd.result;


  /*
   *  Trade Bot Conditions:
   *  
   */
  // down = -0.025
  // up = 1.41523116 > 0.025
  var macd_buy = macddiff > this.settings.macd_thresholds.up;
  var mfi_buy = this.mfi <= this.settings.mfi_thresholds.oversold;
  // var adx_buy = this.settings.adx_thresholds.up < this.adx;
  
  var macd_sell = macddiff < this.settings.macd_thresholds.down;
  var mfi_sell = this.mfi >= this.settings.mfi_thresholds.overbought;
  // var adx_sell = this.settings.adx_thresholds.down > this.adx;

/*
*  Trade Bot Logic : 
*  Check MACD Trend is now upward/positive 
*/
  if(macd_buy && mfi_buy ) {
    // new trend detected
    if(this.trend.direction !== 'up')
        // reset the state for the new trend
        this.trend = {
          duration: 0,
          persisted: false,
          direction: 'up',
          adviced: false
        };

      this.trend.duration++;

      log.debug('In uptrend since', this.trend.duration, 'candle(s)');
      
      if(this.trend.duration >= this.settings.macd_thresholds.persistence)
        this.trend.persisted = true;

      /*
      *  Trade Bot Logic : 
      *  Check MFI for OverBought & MACD Trend Presisted & Not Adviced
      */

      if(this.trend.persisted && !this.trend.adviced) {
        log.debug('Buy');
        this.trend.adviced = true;
        this.advice('long');
        
        // Send the Buy message.
        client.messages.create({
            to: '+19806890840',
            from: '+18782061275',
            body: 'Check LTE | Buy'
          }).then((message) => console.log('message '+message.sid));
              

      } else
        this.advice();
    

    /*
    *  Trade Bot Logic : 
    *  Check MACD Trend is now downward/negative
    */

  } else if(macd_sell && mfi_sell) {

    // new trend detected
    if(this.trend.direction !== 'down')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');
    
    if(this.trend.duration >= this.settings.macd_thresholds.persistence)
      this.trend.persisted = true;

    /*
    *  Trade Bot Logic : 
    *  Check MFI for Oversold & MACD Trend Presisted & Not Adviced
    */
    
    if(this.trend.persisted && !this.trend.adviced) {
      log.debug('Sell');  
      this.trend.adviced = true;
      this.advice('short');

        // Send the Buy message.
        client.messages.create({
            to: '+19806890840',
            from: '+18782061275',
            body: 'Check LTE | Sell'
          }).then((message) => console.log('message '+message.sid));

    } else
      this.advice();

  } else {
    log.debug('In no trend');
    
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
