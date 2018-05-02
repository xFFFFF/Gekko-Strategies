/*

  MACD - DJM 31/12/2013

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};
var MACDSettings = {};

//RSI
var RSI = require('./indicators/RSI.js');

// prepare everything our method needs
method.init = function () {

  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.macdTrend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false,
    recomendation: "none",
    recomendationCount: 0,
    recomended: false
  };

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need

  MACDSettings = {
    short: this.settings.MACD.short,
    long: this.settings.MACD.long,
    signal: this.settings.MACD.signal,
    thresholds: {
      down: this.settings.MACDthresholds.down,
      up: this.settings.MACDthresholds.up,
      persistence: this.settings.MACDthresholds.persistence
    }
  };

  this.addIndicator('macd', 'MACD', MACDSettings);

  this.RSItrend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false,
    recomendation: "none",
    recomendationCount: 0,
    recomended: false
  };

  // RSI
  this.RSISettings = {
    interval: this.settings.RSI.interval,
    thresholds: {
      low: this.settings.RSIthresholds.low,
      high: this.settings.RSIthresholds.high,
      persistence: this.settings.RSIthresholds.persistence
    }
  };

  this.addIndicator('rsi', 'RSI', this.RSISettings);
}

// what happens on every new candle?
method.update = function (candle) {
  // nothing!
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function (candle) {
  var digits = 8;
  // var macd = this.indicators.macd;

  // var diff = macd.diff;
  // var signal = macd.signal.result;

  // log.debug('calculated MACD properties for candle:');
  // log.debug('\t', 'short:', macd.short.result.toFixed(digits));
  // log.debug('\t', 'long:', macd.long.result.toFixed(digits));
  // log.debug('\t', 'macd:', diff.toFixed(digits));
  // log.debug('\t', 'signal:', signal.toFixed(digits));
  // log.debug('\t', 'macdiff:', macd.result.toFixed(digits));

  // RSI
  // var rsi = this.indicators.rsi;

  // log.debug('calculated RSI properties for candle:');
  // log.debug('\t', 'rsi:', rsi.rsi.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function () {

  var maxRecomendationCount = 200;

  var macddiff = this.indicators.macd.result;

  // console.dir(this.indicators);
  // console.log("RSI High Threshold" + this.RSISettings.thresholds.high);

  if (!this.macdTrend.recomended) {
    if (macddiff > MACDSettings.thresholds.up) {

      // new trend detected
      if (this.macdTrend.direction !== 'up')
        // reset the state for the new trend
        this.macdTrend = {
          duration: 0,
          persisted: false,
          direction: 'up',
          adviced: false,
          recomendationCount: 0,
          recomended: false
        };

      this.macdTrend.duration++;

      // log.debug('In uptrend since', this.macdTrend.duration, 'candle(s)');

      if (this.macdTrend.duration >= MACDSettings.thresholds.persistence)
        this.macdTrend.persisted = true;

      if (this.macdTrend.persisted && !this.macdTrend.adviced) {
        this.macdTrend.recomended = true;
        this.macdTrend.recomendation = "long";
      } else {
        this.macdTrend.recomendation = "none";
      }

    } else if (macddiff < MACDSettings.thresholds.down) {

      // new trend detected
      if (this.macdTrend.direction !== 'down')
        // reset the state for the new trend
        this.macdTrend = {
          duration: 0,
          persisted: false,
          direction: 'down',
          adviced: false,
          recomendation: "none",
          recomendationCount: 0,
          recomended: false
        };

      this.macdTrend.duration++;

      // log.debug('In downtrend since', this.macdTrend.duration, 'candle(s)');

      if (this.macdTrend.duration >= MACDSettings.thresholds.persistence) {
        this.macdTrend.persisted = true;
      }

      if (this.macdTrend.persisted && !this.macdTrend.adviced) {
        this.macdTrend.recomended = true;
        this.macdTrend.recomendation = "short";
      } else {
        this.macdTrend.recomendation = "none"
      }
    } else {

      // log.debug('In no trend');

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
      this.macdTrend.recomendation = "none";
      // this.advice();
    }
  }
  else if (this.macdTrend.recomended && this.macdTrend.recomendationCount >= maxRecomendationCount) {
    this.macdTrend.adviced = false;
    this.macdTrend.recomendationCount = 0;
    this.macdTrend.persisted = 0;
    this.macdTrend.duration = 0;
    this.macdTrend.recomended = false;
  }
  else if (this.macdTrend.recomended && this.macdTrend.recomendationCount < maxRecomendationCount) {
    this.macdTrend.recomendationCount++;
  }

  // RSIaction
  var rsi = this.indicators.rsi;
  var rsiVal = rsi.rsi;

  if (!this.RSItrend.recomended) {
    if (rsiVal > this.RSISettings.thresholds.high) {

      // new trend detected
      if (this.RSItrend.direction !== 'high')
        this.RSItrend = {
          duration: 0,
          persisted: false,
          direction: 'high',
          adviced: false,
          recomendation: "none",
          recomendationCount: 0,
          recomended: false
        };

      this.RSItrend.duration++;

      // log.debug('In high since', this.RSItrend.duration, 'candle(s)');

      if (this.RSItrend.duration >= this.RSISettings.thresholds.persistence)
        this.RSItrend.persisted = true;

      if (this.RSItrend.persisted && !this.RSItrend.adviced) {
        this.RSItrend.recomended = true;
        this.RSItrend.recomendation = "short";
        // this.advice('short');
      } else {
        this.RSItrend.recomendation = "none";
        // this.advice();
      }

    } else if (rsiVal < this.RSISettings.thresholds.low) {

      // new trend detected
      if (this.RSItrend.direction !== 'low')
        this.RSItrend = {
          duration: 0,
          persisted: false,
          direction: 'low',
          adviced: false,
          recomendation: "none",
          recomended: false
        };

      this.RSItrend.duration++;

      // log.debug('In low since', this.RSItrend.duration, 'candle(s)');

      if (this.RSItrend.duration >= this.RSISettings.thresholds.persistence)
        this.RSItrend.persisted = true;

      if (this.RSItrend.persisted && !this.RSItrend.adviced) {
        this.RSItrend.recomended = true;
        this.RSItrend.recomendation = "long";
        // this.advice('long');
      } else {
        this.RSItrend.recomendation = "none";
        // this.advice();
      }

    } else {
      // log.debug('In no trend');
      this.RSItrend.recomendation = "none";
      // this.advice();
    }
  }
  else if (this.RSItrend.recomended && this.RSItrend.recomendationCount >= maxRecomendationCount) {
    this.RSItrend.adviced = false;
    this.RSItrend.recomendationCount = 0;
    this.RSItrend.persisted = 0;
    this.RSItrend.duration = 0;
    this.RSItrend.recomended = false;
  }
  else if (this.RSItrend.recomended && this.RSItrend.recomendationCount >= maxRecomendationCount) {
    this.RSItrend.recomendationCount++;
  }
  // if (this.RSItrend.recomendation == "short") {
  //   // this.RSItrend.adviced = true;
  //   this.advice('short');
  // }
  // else if (this.RSItrend.recomendation == "none") {
  //   this.advice();
  // }
  // else if (this.RSItrend.recomendation == "long") {
  //   // this.RSItrend.adviced = true;
  //   this.advice('long');
  // }

  // if (this.macdTrend.recomendation == "short") {
  //   this.advice('short');
  // }
  // else if (this.macdTrend.recomendation == "none") {
  //   this.advice();
  // }
  // else if (this.macdTrend.recomendation == "long") {
  //   this.advice('long');
  // }

  if (this.RSItrend.recomended && this.RSItrend.recomended) {
    console.log("RSI:" + this.RSItrend.recomendation);
    console.log("MACD:" + this.macdTrend.recomendation);
  }

  if (this.RSItrend.recomendation == "short" && this.macdTrend.recomendation == "short") {
    this.RSItrend.advised = true;
    this.macdTrend.adviced = true;
    this.RSItrend.recomended = false;
    this.RSItrend.recomendationCount = 0;
    this.macdTrend.recomended = false;
    this.macdTrend.recomendationCount = 0;
    this.advice('short');
  }
  else if (this.RSItrend.recomendation == "none" || this.macdTrend.recomendation == "none") {
    this.advice();
  }
  else if (this.RSItrend.recomendation == "long" && this.macdTrend.recomendation == "long") {
    this.RSItrend.advised = true;
    this.macdTrend.adviced = true;
    this.RSItrend.recomended = false;
    this.RSItrend.recomendationCount = 0;
    this.macdTrend.recomended = false;
    this.macdTrend.recomendationCount = 0;
    this.advice('long');
  }
  else
  {
    this.RSItrend.recomended = false;
    this.RSItrend.recomendationCount = 0;
    this.macdTrend.recomended = false;
    this.macdTrend.recomendationCount = 0;    
  }
}

module.exports = method;
