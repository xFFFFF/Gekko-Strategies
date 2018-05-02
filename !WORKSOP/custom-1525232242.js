// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.currentTrend;
  this.requiredHistory = this.tradingAdvisor.historySize;

  this.age = 0;
  this.trend = {
    direction: 'undefined',
    duration: 0,
    persisted: false,
    adviced: false
  };
  this.historySize = this.tradingAdvisor.historySize;
  this.ppoadv = 'none';
  this.uplevel = this.settings.thresholds.up;
  this.downlevel = this.settings.thresholds.down;
  this.persisted = this.settings.thresholds.persistence;
  this.addIndicator('custom', 'Custom', this.settings);
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
    var strat = this.indicators.strat;
    if (typeof(strat.result) == 'boolean') {
        log.debug('Insufficient data available. Age: ', strat.size, ' of ', strat.maxSize);
        log.debug('ind: ', strat.TP.result, ' ', strat.TP.age, ' ', strat.TP.depth);
        return;
    }

    log.debug('calculated strat properties for candle:');
    log.debug('\t', 'Price:\t\t\t', this.lastPrice);
    log.debug('\t', 'strat tp:\t', strat.tp.toFixed(8));
    log.debug('\t', 'strat tp/n:\t', strat.TP.result.toFixed(8));
    log.debug('\t', 'strat md:\t', strat.mean.toFixed(8));
    if (typeof(strat.result) == 'boolean' )
        log.debug('\t In sufficient data available.');
    else
        log.debug('\t', 'strat:\t', strat.result.toFixed(2));
}

/*
 *
 */
method.check = function(candle) {

  var price = candle.close;

    this.age++;
    var strat = this.indicators.strat;

    if (typeof(strat.result) == 'number') {

        // overbought?
        if (strat.result >= this.uplevel && (this.trend.persisted || this.persisted == 0) && !this.trend.adviced && this.trend.direction == 'overbought' ) {
            this.trend.adviced = true;
            this.trend.duration++;
            this.advice('short');
        } else if (strat.result >= this.uplevel && this.trend.direction != 'overbought') {
            this.trend.duration = 1;
            this.trend.direction = 'overbought';
            this.trend.persisted = false;
            this.trend.adviced = false;
            if (this.persisted == 0) {
                this.trend.adviced = true;
                this.advice('short');
            }
        } else if (strat.result >= this.uplevel) {
            this.trend.duration++;
            if (this.trend.duration >= this.persisted) {
                this.trend.persisted = true;
            }
        } else if (strat.result <= this.downlevel && (this.trend.persisted || this.persisted == 0) && !this.trend.adviced && this.trend.direction == 'oversold') {
            this.trend.adviced = true;
            this.trend.duration++;
            this.advice('long');
        } else if (strat.result <= this.downlevel && this.trend.direction != 'oversold') {
            this.trend.duration = 1;
            this.trend.direction = 'oversold';
            this.trend.persisted = false;
            this.trend.adviced = false;
            if (this.persisted == 0) {
                this.trend.adviced = true;
                this.advice('long');
            }
        } else if (strat.result <= this.downlevel) {
            this.trend.duration++;
            if (this.trend.duration >= this.persisted) {
                this.trend.persisted = true;
            }
        } else {
            if( this.trend.direction != 'nodirection') {
                this.trend = {
                    direction: 'nodirection',
                    duration: 0,
                    persisted: false,
                    adviced: false
                };
            } else {
                this.trend.duration++;
            }
            this.advice();
        }

    } else {
        this.advice();
    }

    log.debug("Trend: ", this.trend.direction, " for ", this.trend.duration);
}

module.exports = method;
