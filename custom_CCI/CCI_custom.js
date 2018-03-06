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
  this.historySize = this.settings.history;
  this.ppoadv = 'none';
  this.uplevel = this.settings.thresholds.up;
  this.downlevel = this.settings.thresholds.down;
  this.persisted = this.settings.thresholds.persistence;

  // log.debug("CCI started with:\nup:\t", this.uplevel, "\ndown:\t", this.downlevel, "\npersistence:\t", this.persisted);
  // define the indicators we need
  this.addIndicator('cci', 'CCI', this.settings);
  this.previousBuyPrice = false;
  this.previousSellPrice = false;
}

// what happens on every new candle?
method.update = function(candle) {
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function(candle) {
    /*var cci = this.indicators.cci;
    if (typeof(cci.result) == 'boolean') {
        log.debug('Insufficient data available. Age: ', cci.size, ' of ', cci.maxSize);
        log.debug('ind: ', cci.TP.result, ' ', cci.TP.age, ' ', cci.TP.depth);
        return;
    }
    log.debug('calculated CCI properties for candle:');
    log.debug('\t', 'Price:\t\t', candle.close.toFixed(8));
    log.debug('\t', 'CCI tp:\t', cci.tp.toFixed(8));
    log.debug('\t', 'CCI tp/n:\t', cci.TP.result.toFixed(8));
    log.debug('\t', 'CCI md:\t', cci.mean.toFixed(8));

    if (this.previousBuyPrice) {
        log.debug('\t', 'previousBuyPrice:\t', this.previousBuyPrice);
    }
    if (this.previousSellPrice) {
        log.debug('\t', 'previousSellPrice:\t', this.previousSellPrice);
    }
    
    if (typeof(cci.result) == 'boolean' )
        log.debug('\t In sufficient data available.');
    else
        log.debug('\t', 'CCI:\t\t', cci.result.toFixed(2));*/
}

/*
 *
 */
method.check = function(candle) {

    var lastPrice = candle.close;

    this.age++;
    var cci = this.indicators.cci;

    if (typeof(cci.result) == 'number') {

        if (this.previousBuyPrice > 0) {
            this.profit = (this.candle.close - this.previousBuyPrice) / this.previousBuyPrice * 100;
        } else {
            this.profit = 0;
        }

        if (this.profit != 0 && this.settings.thresholds.takeLoss != 0 && this.profit <= this.settings.thresholds.takeLoss) {
            log.debug('Take loss at ' + this.profit.toFixed(2) + '%');
            advice('short', this);
        } else if (this.profit != 0 && this.settings.thresholds.takeProfit != 0 && this.profit >= this.settings.thresholds.takeProfit) {
            log.debug('Take profit at ' + this.profit.toFixed(2) + '%');
            advice('short', this);
        }
        // overbought?
        else if (cci.result >= this.uplevel 
            && (this.trend.persisted || this.persisted == 0) 
            && !this.trend.adviced 
            && this.trend.direction == 'overbought' 
            && ((this.profit >= 0 && this.profit >= this.settings.thresholds.minProfit) || this.profit < 0 && this.settings.thresholds.negativeProfit == 1)) {
            this.trend.adviced = true;
            this.trend.duration++;
            advice('short', this);
        } else if (cci.result >= this.uplevel 
            && this.trend.direction != 'overbought' 
            && ((this.profit >= 0 && this.profit >= this.settings.thresholds.minProfit)  || this.profit < 0 && this.settings.thresholds.negativeProfit == 1)) {
            this.trend.duration = 1;
            this.trend.direction = 'overbought';
            this.trend.persisted = false;
            this.trend.adviced = false;
            if (this.persisted == 0) {
                this.trend.adviced = true;
                advice('short', this);
            }
        } else if (cci.result >= this.uplevel) {
            this.trend.duration++;
            if (this.trend.duration >= this.persisted) {
                this.trend.persisted = true;
            }
        } else if (cci.result <= this.downlevel && (this.trend.persisted || this.persisted == 0) && !this.trend.adviced && this.trend.direction == 'oversold') {
            this.trend.adviced = true;
            this.trend.duration++;
            advice('long', this);
        } else if (cci.result <= this.downlevel && this.trend.direction != 'oversold') {
            this.trend.duration = 1;
            this.trend.direction = 'oversold';
            this.trend.persisted = false;
            this.trend.adviced = false;
            if (this.persisted == 0) {
                this.trend.adviced = true;
                advice('long', this);
            }
        } else if (cci.result <= this.downlevel) {
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

    // log.debug("Trend: ", this.trend.direction, " for ", this.trend.duration);
}

function advice(position, candle) {
    if (position == 'short') {
        candle.advice('short');

        if (candle.previousBuyPrice > 0 || candle.previousBuyPrice === false) {
            log.debug('previousBuyPrice: ', candle.previousBuyPrice);
            log.debug('Current price: ', candle.candle.close);
            log.debug('Profit: ', candle.profit.toFixed(2) + '%');
            log.debug('SELL! \n');
            candle.previousSellPrice = candle.candle.close;
            candle.previousBuyPrice = 0;
        }
        
    };
    if (position == 'long') {
        candle.advice('long');

        if (candle.previousSellPrice > 0 || candle.previousSellPrice === false) {
            log.debug('previousSellPrice: ', candle.previousSellPrice);
            log.debug('Current price: ', candle.candle.close);
            log.debug('Profit: ', candle.profit.toFixed(2) + '%');
            log.debug('BUY! \n');
            candle.previousBuyPrice = candle.candle.close;
            candle.previousSellPrice = 0;
        }
    };
}
module.exports = method;
