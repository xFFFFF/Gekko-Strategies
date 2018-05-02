/*

  RSI - cykedev 14/02/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};
var fatherOnLowPoint = false;
// prepare everything our method needs
method.init = function ()
{
  this.name = 'RSI';

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.trendFather = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', this.settings);
  this.addIndicator('rsiFather', 'RSI', { interval: this.settings.interval + 5 , low: this.settings.low + 3, high: this.settings.high-5  });
}

// for debugging purposes log the last
// calculated parameters.
method.log = function (candle)
{
  var digits = 8;
  var rsi = this.indicators.rsi;

  log.debug('calculated RSI properties for candle:');
  log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
  log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function ()
{
  var rsi = this.indicators.rsi;
  var rsiFather = this.indicators.rsiFather;
  var rsiVal = rsi.result;
  var rsiValFather = rsiFather.result;

  //RSI FATHER MAIN ----------------
  if (rsiValFather > this.settings.thresholds.high)
  {

    // new trend detected
    if (this.trendFather.direction !== 'high')
      this.trendFather = {
        duration: 0,
        persisted: false,
        direction: 'high',
        adviced: false
      };

    this.trendFather.duration++;

    log.debug('FATHER ...> high since', this.trendFather.duration, 'candle(s)');

    if (this.trendFather.duration >= this.settings.thresholds.persistence)
      this.trendFather.persisted = true;

    if (this.trendFather.persisted && !this.trendFather.adviced)
    {
      this.trendFather.adviced = true;
      this.fatherOnLowPoint = true;
    }

  } else if (rsiValFather < this.settings.thresholds.low)
  {

    // new trend detected
    if (this.trendFather.direction !== 'low')
      this.trendFather = {
        duration: 0,
        persisted: false,
        direction: 'low',
        adviced: false
      };

    this.trendFather.duration++;

    log.debug('FATHER ---> IN low since', this.trendFather.duration, 'candle(s)');

    if (this.trendFather.duration >= this.settings.thresholds.persistence)
      this.trendFather.persisted = true;

    if (this.trendFather.persisted && !this.trendFather.adviced)
    {
      this.trendFather.adviced = true;
      this.fatherOnLowPoint = false;

    }
  } else
  {

    log.debug('In no trend');

  }


  //RSI MAIN ----------------
  if (rsiVal > this.settings.thresholds.high)
  {

    // new trend detected
    if (this.trend.direction !== 'high')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'high',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In high since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced && this.trendFather.direction === 'high' )
    {
      this.trend.adviced = true;
      this.advice('short');
      log.debug('SELL AT ---------->');

    } else
      this.advice();

  } else if (rsiVal < this.settings.thresholds.low)
  {

    // new trend detected
    if (this.trend.direction !== 'low')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'low',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In low since', this.trend.duration, 'candle(s)');

    if (this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if (this.trend.persisted && !this.trend.adviced && this.trendFather.direction === 'low' )
    {
      this.trend.adviced = true;
      this.advice('long');
      log.debug('BUY AT ---------->');

    } else
      this.advice();

  } else
  {

    log.debug('In no trend');

    this.advice();
  }
}

module.exports = method;
