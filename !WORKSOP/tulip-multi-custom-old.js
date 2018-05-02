var _ = require('lodash');
var log = require('../core/log.js');

var method = {};
method.init = function() {
    // strat name
    this.name = 'tulip-multi-custom';
    // trend information
    this.trend = {
        direction: 'none',
        duration: 0,
        persisted: false,
        adviced: false
    };
    this.smaTrend = {
        direction: 'none',
        percent: 0,
        persisted: false
    };

    // tulip indicators use this sometimes
    this.requiredHistory = this.settings.historySize;
    // define the indicators we need
    this.addTulipIndicator('myadx', 'adx', this.settings); // 0 ... 60
    this.addTulipIndicator('mymacd', 'macd', this.settings);
    this.addTulipIndicator('myrsi', 'rsi', this.settings); // 0 ... 100
    this.addTulipIndicator('mysma', 'sma', this.settings); 
    this.addTulipIndicator('myroc', 'roc', this.settings); 
    this.addTulipIndicator('mycci', 'cci', this.settings);  // 200 ... -200

    // defive vars
    this.previousBuyPrice = false;
    this.previousSellPrice = false;
    this.RSIhistory = [];   
    this.bubbleTriggered = false;
}

// what happens on every new candle?
method.update = function(candle) {
    // tulip results
    this.adx = this.tulipIndicators.myadx.result.result;
    this.macd = this.tulipIndicators.mymacd.result.macdHistogram;
    this.rsi = this.tulipIndicators.myrsi.result.result;
    this.sma = this.tulipIndicators.mysma.result.result;
    this.roc = this.tulipIndicators.myroc.result.result;
    this.cci = this.tulipIndicators.mycci.result.result;

    this.RSIhistory.push(this.rsi);
    if(_.size(this.RSIhistory) > this.settings.stochRSI_interval) {
        // remove oldest RSI value
        this.RSIhistory.shift();
    }

    this.lowestRSI = _.min(this.RSIhistory);
    this.highestRSI = _.max(this.RSIhistory);
    this.stochRSI = ((this.rsi - this.lowestRSI) / (this.highestRSI - this.lowestRSI)) * 100;
}

method.log = function() {


}

method.check = function() {
    if (this.previousBuyPrice > 0) {
        this.profit = (this.candle.close - this.previousBuyPrice) / this.previousBuyPrice * 100;
    } else {
        this.profit = 0;
    }

    if (this.profit != 0 && this.settings.takeLoss != 0 && this.profit <= this.settings.takeLoss) {
        log.debug('Take loss at ' + this.profit.toFixed(2) + '%');
        advice('short', this);
    } else if (this.profit != 0 && this.settings.takeProfit != 0 && this.profit >= this.settings.takeProfit) {
        log.debug('Take profit at ' + this.profit.toFixed(2) + '%');
        advice('short', this);
    } else if (this.profit != 0 && this.settings.bubbleBurstProtection == 1 && !this.bubbleTriggered && this.smaTrend.direction == 'descending' && this.smaTrend.persisted ) {
        log.debug('Bubble burst protection triggered! Closing position.');
        advice('short', this);
        this.bubbleTriggered = true;
    }


    // Trend direction check (for SMA)
    this.smaTrend.smaPercent = Math.round((this.sma - this.candle.close) / this.candle.close * 100);

    if (this.settings.use_sma) {
        if (this.smaTrend.smaPercent <= this.settings.sma_up) {
            // log.debug("rising ", this.smaTrend.smaPercent);
            if(this.smaTrend.direction != "rising") {
                this.smaTrend.duration = 0;
                this.smaTrend.persisted = false;
            }
            this.smaTrend.direction = "rising";
        } else if (this.smaTrend.smaPercent >= this.settings.sma_down) {
            // log.debug("descending ", this.smaTrend.smaPercent);
            if(this.smaTrend.direction != "descending") {
                this.smaTrend.duration = 0;
                this.smaTrend.persisted = false;
            }
            this.smaTrend.direction = "descending";
        } else {
            // log.debug("flat ", this.smaTrend.smaPercent);
            if(this.smaTrend.direction != "flat") {
                this.smaTrend.duration = 0;
                this.smaTrend.persisted = false;
            }
            this.smaTrend.direction = "flat";
        }

        if (this.smaTrend.duration >= this.settings.sma_persistence) {
            this.smaTrend.persisted = true;
        } else {
            this.smaTrend.persisted = false;
        }

        this.smaTrend.duration++;
    };
    

    // Trend direction check (for StochRSI)
    if (this.stochRSI > this.settings.stochRSI_up) {
        // new trend detected
        if(this.trend.direction !== 'high') {
            this.trend = {
                duration: 0,
                persisted: false,
                direction: 'high',
                adviced: false
            };
        };
            
        this.trend.duration++;

        // log.debug('In high since', this.trend.duration, 'candle(s)');

        if (this.trend.duration >= this.settings.stochRSI_persistence) {
            this.trend.persisted = true;
        };

        if (this.trend.persisted && !this.trend.adviced) {
            this.trend.adviced = true;
        };
    } else if(this.stochRSI < this.settings.stochRSI_down) {
        // new trend detected
        if(this.trend.direction !== 'low') {
            this.trend = {
                duration: 0,
                persisted: false,
                direction: 'low',
                adviced: false
            };
        }
            
        this.trend.duration++;

        // log.debug('In low since', this.trend.duration, 'candle(s)');

        if(this.trend.duration >= this.settings.stochRSI_persistence) {
            this.trend.persisted = true;
        }

        if(this.trend.persisted && !this.trend.adviced) {
            this.trend.adviced = true;
        }

    } else {
        // trends must be on consecutive candles
        this.trend.duration = 0;
        // log.debug('In no trend');
    }

    // just add a long and short to each array when new indicators are used
    var long  = [];
    var short = [];

    if (this.settings.use_rsi) {
        long.push(this.rsi < this.settings.rsi_down);
        short.push(this.rsi > this.settings.rsi_up);
    };
    // if (this.settings.use_stochRSI) {
    //     long.push(this.stochRSI < this.settings.stochRSI_down);
    //     short.push(this.stochRSI > this.settings.stochRSI_up);
    // };
    // 
                
    if (this.settings.use_stochRSI) {
        if (this.smaTrend.direction != "descending" && this.smaTrend.persisted == true) {
            log.debug('this.smaTrend.direction ', this.smaTrend.direction);
            log.debug('this.smaTrend.persisted ', this.smaTrend.persisted);
            long.push(this.stochRSI < this.settings.stochRSI_down && this.trend.persisted && this.trend.adviced);
            short.push(this.stochRSI > this.settings.stochRSI_up && this.trend.persisted && this.trend.adviced);
        }
        
    };
    if (this.settings.use_cci) {
        long.push(this.cci < this.settings.cci_down);
        short.push(this.cci > this.settings.cci_up);
    };
    if (this.settings.use_adx) {
        long.push(this.adx < this.settings.adx_down);
        short.push(this.adx > this.settings.adx_up);
    };
    if (this.settings.use_macd) {
        long.push(this.macd < this.settings.macd_down);
        short.push(this.macd > this.settings.macd_up);
    };
    // if (this.settings.use_sma) {
    //     long.push(this.sma < this.settings.sma_down);
    //     short.push(this.sma > this.settings.sma_up);
    // };
    if (this.settings.use_roc) {
        long.push(this.roc < this.settings.roc_down);
        short.push(this.roc > this.settings.roc_up);
    };

    // log.debug(this.trend);

    const all_long = long.reduce((total, long)=>long && total, true);
    const all_short = short.reduce((total, long)=>long && total, true);
    
    // combining all indicators with AND
    if (all_long) {
        advice('long', this);
    } else if (
        all_short 
        && (
            (this.profit >= 0 && (this.profit >= this.settings.minProfit)) 
            || this.profit < 0 && this.settings.negativeProfit == 1)) {
        advice('short', this);
    } else {
        this.advice();
    }
}

function advice(position, candle) {
    if (position == 'short') {
        candle.advice('short');

        if (candle.previousBuyPrice > 0 || candle.previousBuyPrice === false) {
            debug();
            candle.previousSellPrice = candle.candle.close;
            candle.previousBuyPrice = 0;
        }
    };
    if (position == 'long') {
        candle.advice('long');

        if (candle.previousSellPrice > 0 || candle.previousSellPrice === false) {
            debug();
            candle.previousBuyPrice = candle.candle.close;
            candle.previousSellPrice = 0;
        }
    };

    function debug() {
        if (position == 'long') {
            log.debug('BUY! \n');
            log.debug('previousBuyPrice: ', candle.previousBuyPrice);
        };
        if (position == 'short') {
            log.debug('SELL! \n');
            log.debug('previousSellPrice: ', candle.previousSellPrice);
        };
        log.debug('Current price: ', candle.candle.close);
        if (candle.profit) {
            log.debug('Profit: ', candle.profit.toFixed(2) + '%');
        };

        // for debugging purposes log the last
        // calculated parameters.
        //  adx roc rsi macd stddev sma
        log.debug(
        `---------------------
        Tulip ADX: ${candle.adx}
        Tulip MACD: ${candle.macd}
        Tulip RSI: ${candle.rsi}
        Tulip StochRSI: ${candle.stochRSI}
        Tulip SMA: ${candle.sma}
        SMA percent: ${candle.smaTrend.smaPercent}
        SMA direction: ${candle.smaTrend.direction}
        SMA persisted: ${candle.smaTrend.persisted}
        Tulip ROC: ${candle.roc}
        Tulip CCI: ${candle.cci}
        `);
    }
}
module.exports = method;
