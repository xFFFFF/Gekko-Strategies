var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.ZERO;

// ZERO-lag MACD variant by kuzetsa, 2014 June/July
var method = {};

// prepare everything our method needs
method.init = function() {

  this.name = 'ZERO';

  this.trend = {
    direction: 'none',
    duration: 0
  };

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = config.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('zero', 'ZERO', settings);

};

// what happens on every new candle?
method.update = function(candle) {
  // NOTHING!!!
  // (just kidding, OOP takes care of it)
};

method.log = function() {
  var digits = 8;
  var zero = this.indicators.zero;
  var windowstats = zero.windowstats;

  // historical stats for the sanity checking window:
  log.debug('\t', 'VWAP:', windowstats.vwap.toFixed(digits));
  log.debug('(percentiles) window stats:');
  log.debug('\t', '1st:', windowstats.p1st.toFixed(digits));
  log.debug('\t', '5th:', windowstats.p5th.toFixed(digits));
  log.debug('\t', '10th:', windowstats.p10th.toFixed(digits));
  log.debug('\t', '12th~ish:', windowstats.pFancyEighth.toFixed(digits));
  log.debug('\t', '25th:', windowstats.p25th.toFixed(digits));
  log.debug('\t', '40th:', windowstats.p40th.toFixed(digits));
  log.debug('\t', 'median:', windowstats.p50th.toFixed(digits));

  // these work, but are irrelevant for buy-and-hold reinvestment:
  // log.debug('\t', '60th:', windowstats.p60th.toFixed(digits));
  // log.debug('\t', '75th:', windowstats.p75th.toFixed(digits));
  // log.debug('\t', '90th:', windowstats.p90th.toFixed(digits));
  // log.debug('\t', '95th:', windowstats.p95th.toFixed(digits));
  // log.debug('\t', '99th:', windowstats.p99th.toFixed(digits));

  log.info('\t', '[shortEMA]CLOSE:', zero.shortC.result.toFixed(digits));
  log.info('\t', '[longEMA]CLOSE:', zero.longC.result.toFixed(digits));
  log.info('\t', 'macd:', zero.diff.toFixed(digits));
  log.info('\t', 'signal:', zero.signal.result.toFixed(digits));
  log.info('\t', 'macdiff:', zero.result.toFixed(digits));
};

method.check = function() {

  var zero = this.indicators.zero;
  var windowstats = zero.windowstats;
  var macd = zero.diff;
  var signal = zero.signal.result;
  var macdiff = zero.result;
  var minup = settings.thresholds.up;
  // "divination" lets the signal happen sooner
  var crystalball = settings.crystalball;
  var divination = macd + crystalball;
  var filtered = Math.min(macdiff, divination);

  if ((filtered >= minup) && (macd <= crystalball) && (signal < 0) && (windowstats.vwap <= windowstats.pFancyEighth)) {

    // new trend detected
    if(this.trend.direction !== 'up') {
      this.trend = {
        duration: 0,
        direction: 'up',
      };
      this.advice('long');
    } else {
      // portfolioManager.js needs audited
      // as a workaround, this logic will
      // IMMEDIATELY release the lizards
      // but it doesn't reset the trend
      // ... it's to un-enforce position
      // kuzetsa, 2014 June/July
      this.advice('lizard');
    }

    this.trend.duration++;
    log.info('In uptrend since', this.trend.duration, 'candle(s)');

  } else {

      this.trend = {
        // lizard duration always zero
        duration: 0,
        direction: 'lizards',
      };

    this.advice('lizards');

  }
};

module.exports = method;
