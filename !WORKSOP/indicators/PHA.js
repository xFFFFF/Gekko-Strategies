/*
 * CCI
 */
var log = require('../../core/log');
var _ = require('lodash');

var Indicator = function(settings) {
  _.bindAll(this);
  this.input = 'candle';
  this.result = 0;
  this.hist = []; // needed for mean?
  this.trend = 0;
  this.size = 0;
  //   this.constant = settings.constant;
  // this.maxSize = settings.history;
};

Indicator.prototype.update = function(candle) {
  //Ignore duplicated
  if (this.size > 0 && this.hist[this.size - 1].id === candle.id) {
    return;
  }
  // Push new candle to history array.
  this.hist[this.size] = candle;
  this.size++;
  // Not enough data
  if (this.size < 3) {
    this.result = 0;
    return;
  }
  // Detect current trend
  var trend = this.detectTrend(this.hist);
  if (trend === -1) {
    this.result = -1;
    return;
  }
  // Trend is increase after red
  var prev3Candle = this.getPreviousCandle(
    this.hist[this.size - 1],
    this.hist,
    2
  );
  // Check rule
  if (
    trend === 1 &&
    prev3Candle &&
    this.size > 2 &&
    !this.isIncreased(prev3Candle)
  ) {
    this.result = 1;
    return;
  }
  this.result = 0;
};

Indicator.prototype.detectTrend = function(history) {
  // Not enough data => no trend
  if (!Array.isArray(history) || history.length < 2) {
    return 0;
  }
  var lastCandle = history[history.length - 1];
  var prevCandle = this.getPreviousCandle(lastCandle, this.hist);
  // Cannot find privouse candle
  if (!prevCandle) {
    return 0;
  }
  if (this.isIncreased(lastCandle) && this.isIncreased(prevCandle)) {
    // If we have 2 green candles and last candle not too height
    if (
      this.getCandleHeight(history[history.length - 1]) <
      5 * this.getCandleHeight(history[history.length - 2])
    ) {
      return 1;
    }
  }
  // If we have 2 red canndles
  if (!this.isIncreased(lastCandle) && !this.isIncreased(prevCandle)) {
    return -1;
  }
  // Default => 0
  return 0;
};

Indicator.prototype.isIncreased = function(candle) {
  return candle.close > candle.open;
};

Indicator.prototype.getCandleHeight = function(candle) {
  return candle.close - candle.open;
};

/**
 * Helper to ignore duplicated candles
 * @param {*} candle
 * @param {*} history
 * @param {*} distance
 * @returns candle if found, otherwise null
 */
Indicator.prototype.getPreviousCandle = function(
  candle,
  history,
  distance = 1
) {
  if (!Array.isArray(history)) return null;
  if (history.length < distance + 1) {
    return null;
  }
  var found = 0;
  var l = history.length - 1;
  while (l >= 0) {
    if (history[l].id !== candle.id) {
      found++;
      if (found == distance) {
        return history[l];
      }
    }
    l--;
  }
  return null;
};

module.exports = Indicator;
