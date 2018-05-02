// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var UO = require('./indicators/UO.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
    this.name = 'UO';

    this.trends = {
        stc: {
            direction: 'none',
            duration: 0,
            persisted: false,
            adviced: false
        },
        uo: {
            direction: 'none',
            duration: 0,
            persisted: false,
            adviced: false
        }
    };


    // define the indicators we need
    this.addIndicator('dema', 'DEMA', this.settings.dema);
    this.addIndicator('stc', 'STC', this.settings.stc);
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
    var digits = 8;
    var uo = this.indicators.uo;
    var stc = this.indicators.stc;

    // log.debug('calculated Ultimate Oscillator properties for candle:');
    // log.debug('\t', 'UO:', uo.uo.toFixed(digits));
    // log.debug('\t', 'STC:', stc.result.toFixed(digits));
    // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function() {
    var diff = his.indicators.dema.result;


    if(diff > this.settings.dema.thresholds.up) {
        log.debug('we are currently in uptrend', message);

    if(this.currentTrend !== 'up') {
      this.currentTrend = 'up';
      this.advice('long');
    } else
      this.advice();

    } else if(diff < this.settings.dema.thresholds.down) {
    log.debug('we are currently in a downtrend', message);

    if(this.currentTrend !== 'down') {
      this.currentTrend = 'down';
      this.advice('short');
    } else
      this.advice();

    } else {
        log.debug('we are currently not in an up or down trend', message);
        this.advice();
    }

    if (this.indicators.stc.result > this.settings.stc.thresholds.high) {
        // new trend detected
        if (this.trends.stc.direction !== 'high')
            this.trends.stc = {
                duration: 0,
                persisted: false,
                direction: 'high',
                adviced: false
            };

        this.trends.stc.duration++;

        //log.debug('In high since', this.trends.stc.duration, 'candle(s)');

        if (this.trends.stc.duration >= this.settings.stc.thresholds.persistence) {
          this.trends.stc.persisted = true;
        }
            



    } else if (this.indicators.stc.result < this.settings.stc.thresholds.low) {
        // new trend detected
        if (this.trends.stc.direction !== 'low')
            this.trends.stc = {
                duration: 0,
                persisted: false,
                direction: 'low',
                adviced: false
            };

        this.trends.stc.duration++;

        //log.debug('In low since', this.trends.stc.duration, 'candle(s)');

        if (this.trends.stc.duration >= this.settings.stc.thresholds.persistence) {
          this.trends.stc.persisted = true;
        }
    }



    if ((this.trends.uo.persisted && !this.trends.uo.adviced) && (this.trends.stc.persisted && !this.trends.stc.adviced) && this.trends.uo.direction == 'high') {
        this.trends.uo.adviced = true;
        this.trends.stc.adviced = true;
        this.advice('short');
    } else if ((this.trends.uo.persisted && !this.trends.uo.adviced) && (this.trends.stc.persisted && !this.trends.stc.adviced)  && this.trends.uo.direction == 'low') {
        this.trends.uo.adviced = true;
        this.trends.stc.adviced = true;
        this.advice('long');
    } else {
        this.advice();
    }
}

module.exports = method;