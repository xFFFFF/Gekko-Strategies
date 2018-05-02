/*

  PPO - cykedev 15/01/2014

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log');
var moment = require('moment');

// let's create our own method
var method = {};
var digits = 8;


// prepare everything our method needs
method.init = function () {
  this.name = 'PPO';

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false,
    hist: null,
    slope: 0,
    shortPrice: null,
    shortDate: null,
    longPrice: null,
    longDate: null,
    lastTrend: null,
    price: null
  };

  this.trend.lastTrend = this.trend;

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('ppo', 'PPO', this.settings);
  // this.addIndicator('cci', 'CCI', this.settings.cci);


  // add the indicator to the strategy
  this.addTulipIndicator('linregslope', 'linregslope', this.settings.linregslope);
  this.addTulipIndicator('cci', 'cci', this.settings.cci);
  this.addTulipIndicator('bb', 'bbands', this.settings.bb);
  this.addTulipIndicator('vosc', 'vosc', this.settings.vosc);
}

method.check = function () {
  // use indicator results
  // var result = this.tulipIndicators.mymacd.result;
  // var macddiff = result['macd'] - result['macdSignal'];

  // do something with macdiff
}

// what happens on every new candle?
method.update = function (candle) {
  this.trend.start = candle.start;
  log.debug('new candle', this.trend.start.utc().format('YYYY-MM-DD h:mm:ss a'));

  // nothing!
}

// for debugging purposes log the last
// calculated parameters.
method.log = function () {
  var ppo = this.indicators.ppo;
  // var cci = this.indicators.cci.result;
  var long = ppo.result.longEMA;
  var short = ppo.result.shortEMA;
  var macd = ppo.result.macd;
  var result = ppo.result.ppo;
  var macdSignal = ppo.result.MACDsignal;
  var ppoSignal = ppo.result.PPOsignal;
  var ppoHist = (result - ppoSignal).toFixed(digits)
  var linregslope = this.tulipIndicators.linregslope.result.result.toFixed(digits);
  var cci = this.tulipIndicators.cci.result.result;
  var bb = this.tulipIndicators.bb.result;
  var vosc = this.tulipIndicators.vosc.result.result;

  log.debug('cci bb', cci, bb, vosc);

  log.debug('calculated MACD properties for candle:');
  // log.debug('\t', 'short:', short.toFixed(digits));
  // log.debug('\t', 'long:', long.toFixed(digits));
  // log.debug('\t', 'macd:', macd.toFixed(digits));
  // log.debug('\t', 'macdsignal:', macdSignal.toFixed(digits));
  // log.debug('\t', 'machist:', (macd - macdSignal).toFixed(digits));
  log.debug('\t', 'ppo:', result.toFixed(digits));
  log.debug('\t', 'pposignal:', ppoSignal.toFixed(digits));
  log.debug('\t', 'ppohist:', ppoHist);
  // log.debug('\t', 'hist:', this.trend.hist);
  log.debug('\t', 'ppoRate:', ((ppoHist - this.trend.hist) / Math.abs(this.trend.hist)));
  log.debug('\t', 'myLinregslope', linregslope);
  log.debug('\t', 'slopeRate:', (linregslope - this.trend.slope) / Math.abs(this.trend.slope));


};

method.check = function (candle) {
  var price = candle.close;
  var ppo = this.indicators.ppo;
  var long = ppo.result.longEMA;
  var short = ppo.result.shortEMA;
  var macd = ppo.result.macd;
  var po = ppo.result.ppo;
  var bb = this.tulipIndicators.bb.result;
  var vosc = this.tulipIndicators.vosc.result.result;
  var macdSignal = ppo.result.MACDsignal;
  var signal = ppo.result.PPOsignal;
  var linregslope = this.tulipIndicators.linregslope.result.result.toFixed(digits);
  var cci = this.tulipIndicators.cci.result.result;
  var slopeRate = (linregslope - this.trend.slope) / Math.abs(this.trend.slope);
  var ppoHist = po - signal;
  var histRate = (ppoHist - this.trend.hist) / Math.abs(this.trend.hist);
  var longPriceRate = this.trend.longPrice ? (price - this.trend.longPrice) / Math.abs(this.trend.longPrice) : null;
  var priceRate = (price - this.trend.lastTrend.price) / Math.abs(this.trend.lastTrend.price);
  var duration = moment.duration(candle.start.diff(this.trend.longDate)).asHours();
  var isCciBounced = this.trend.lastTrend.cci && cci > -100 && this.trend.lastTrend.cci < -120;
  var isCciPlunging = this.trend.lastTrend.cci > 120 && cci <= 120;
  var isBBnarrow = (bb.bbandsUpper - bb.bbandsLower).toFixed(4) < 0.0001;


  // TODO: is this part of the indicator or not?
  // if it is it should move there


  log.debug('\t', 'current price: ', price);
  // log.debug('buying price: ', this.trend.longPrice);
  // log.debug('selling price: ', this.trend.shortPrice);
  log.debug('\t', 'histRate:', histRate);
  log.debug('\t', 'priceRate:', priceRate);
  log.debug('\t', 'longPriceRate:', longPriceRate);
  log.debug('\t', 'hours', moment.duration(candle.start.diff(this.trend.longDate)).asHours());


  if (!isBBnarrow &&
    vosc > 0 &&
    histRate > 0.4 ||
    (price <= this.trend.shortPrice && (histRate > 0 && ppoHist > -0.15 && linregslope > -0.3 && slopeRate > 0) && isCciBounced)) {

    if (this.trend.direction !== 'up') {
      Object.assign(this.trend, {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      });

      this.trend.duration++;

      log.debug('In uptrend since', this.trend.duration, 'candle(s)');
    }

    if (this.trend.duration >= this.settings.thresholds.persistence) {
      this.trend.persisted = true;
    }

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      log.debug('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
      this.advice('long');
      this.trend.longPrice = price;
      this.trend.longDate = candle.start;
    } else {
      this.advice();
    }
  } else if (longPriceRate &&
    longPriceRate >= 0.10 ||
    (longPriceRate >= 0.03 && isCciPlunging) ||
    duration >= 12 && longPriceRate >= -0.01) {
    // (ppoHist / this.trend.hist) - 1 < 0 && (myLinregslope / this.trend.slope) - 1 < 0 && ((price / this.trend.longPrice) - 1 >= 0.05 || ((price / this.trend.longPrice) - 1 < 0 &&(price / this.trend.longPrice) - 1 >= -0.0000005))
    // new trend detected
    if (this.trend.direction !== 'down')
      Object.assign(this.trend, {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      });


    this.trend.duration++;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      log.debug('----------------------------------------------------------------------------------------------------');
      this.advice('short');
      this.trend.shortPrice = price;
      this.trend.shortDate = candle.start;
      this.trend.longPrice = null;
      this.trend.longDate = null;
    } else {
      this.advice();
    }


  } else {

    log.debug('In no trend');

    if (this.trend.direction)

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

  this.trend.hist = ppoHist;
  this.trend.slope = linregslope;
  this.trend.price = price;
  this.trend.lastTrend = this.trend;
  this.trend.cci = cci;
  log.debug('\n\n');
};

module.exports = method;
