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

    this.macdTrend = {
      direction: 'none',
      duration: 0,
      persisted: false,
      adviced: false
    };

    this.rsiSettings = {
        optInTimePeriod: this.settings.RSI_optInTimePeriod
    };

    this.stochSettings = {
        // optInTimePeriod: this.settings.stoch_optInTimePeriod,
        optInFastKPeriod: this.settings.stoch_optInFastKPeriod,
        optInSlowKPeriod: this.settings.stoch_optInSlowKPeriod,
        optInSlowDPeriod: this.settings.stoch_optInSlowDPeriod
    };

    this.macdSettings = {
        optInFastPeriod: this.settings.macd_optInFastPeriod,
        optInSlowPeriod: this.settings.macd_optInSlowPeriod,
        optInSignalPeriod: this.settings.macd_optInSignalPeriod
    };

    this.smaSettings = {
        optInTimePeriod: this.settings.sma_optInTimePeriod
    }
    // tulip indicators use this sometimes
    this.requiredHistory = this.settings.historySize;


    // define the indicators we need
    this.addTulipIndicator('mystoch', 'stoch', this.stochSettings); 
    this.addTulipIndicator('myrsi', 'rsi', this.rsiSettings); // 0 ... 100
    this.addTulipIndicator('mysma', 'sma', this.smaSettings); 
    this.addTulipIndicator('mymacd', 'macd', this.macdSettings);
    // this.addTulipIndicator('myadx', 'adx', this.settings); // 0 ... 60
    // this.addTulipIndicator('myroc', 'roc', this.settings); 
    // this.addTulipIndicator('mycci', 'cci', this.settings);  // 200 ... -200

    // defive vars
    this.previousBuyPrice = false;
    this.previousSellPrice = false;
    this.RSIhistory = [];   
}

// what happens on every new candle?
method.update = function(candle) {
    // log.debug(this.settings);
    // tulip results
    this.stoch = this.tulipIndicators.mystoch.result;
    this.rsi = this.tulipIndicators.myrsi.result.result;
    this.sma = this.tulipIndicators.mysma.result.result;
    this.macd = this.tulipIndicators.mymacd.result;
/*    this.adx = this.tulipIndicators.myadx.result.result;
    this.roc = this.tulipIndicators.myroc.result.result;
    this.cci = this.tulipIndicators.mycci.result.result;
*/
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

    // Protection
    // -------------------------------------------------------------
    if (this.profit != 0 && this.settings.takeLoss != 0 && this.profit <= this.settings.takeLoss) {
        log.debug('Take loss at ' + this.profit.toFixed(2) + '%');
        advice('short', this);
    } else if (this.profit != 0 && this.settings.takeProfit != 0 && this.profit >= this.settings.takeProfit) {
        log.debug('Take profit at ' + this.profit.toFixed(2) + '%');
        advice('short', this);
    };


    // Trend direction check (for SMA)
    // -------------------------------------------------------------
    this.smaTrend.smaPercent = (this.sma - this.candle.close) / this.candle.close * 100;


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
    

    // Trend direction check (for StochRSI)
    // -------------------------------------------------------------
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

    

    // Trend direction check MACD
    // -------------------------------------------------------------
    if (/*this.macd.macdHistogram > 0 && */this.macd.macdSignal > this.settings.macd_up) {

        if (this.macdTrend.direction !== 'up') {
            // reset the state for the new trend
            this.macdTrend = {
              duration: 0,
              persisted: false,
              direction: 'up'
            };
        }
        this.macdTrend.duration++;

        // log.debug('In uptrend since', this.macdTrend.duration, 'candle(s)');

        if (this.macdTrend.duration >= this.settings.macd_persistence) {
            this.macdTrend.persisted = true;
        };

        /*if(this.macdTrend.persisted && !this.macdTrend.adviced) {
            this.macdTrend.adviced = true;
            this.advice('long');
        } else {
            this.advice();
        };*/

    } else if (/*this.macd.macdHistogram < 0 && */this.macd.macdSignal < this.settings.macd_down) {
        // new trend detected
        if (this.macdTrend.direction !== 'down') {
            // reset the state for the new trend
            this.macdTrend = {
                duration: 0,
                persisted: false,
                direction: 'down'
            };
        }
        this.macdTrend.duration++;

        // log.debug('In downtrend since', this.macdTrend.duration, 'candle(s)');

        if (this.macdTrend.duration >= this.settings.macd_persistence){
            this.macdTrend.persisted = true;
        };

        /*if(this.macdTrend.persisted && !this.macdTrend.adviced) {
            this.macdTrend.adviced = true;
            this.advice('short');
        } else {
            this.advice();
        };*/
    } else {
      // log.debug('In no trend');

      // we're not in an up nor in a downtrend
      // but for now we ignore sideways trends
      //
      // read more @link:
      //
      // https://github.com/askmike/gekko/issues/171
        if (this.macdTrend.direction !== 'none') {
            // reset the state for the new trend
            this.macdTrend = {
                duration: 0,
                persisted: false,
                direction: 'none'
            };
        }

        this.macdTrend.duration++;

        if (this.macdTrend.duration >= this.settings.macd_persistence){
            this.macdTrend.persisted = true;
        };
      // this.advice();
    };

/*    if (this.macdTrend.direction = "up") {
        log.debug(this.macdTrend);
        log.debug(this.macd);
    }*/
    // just add a long and short to each array when new indicators are used
    var long  = [];
    var short = [];

    if (this.settings.use_stoch) {
        long.push(this.stoch.stochD < this.settings.stoch_down && this.stoch.stochK < this.settings.stoch_down && this.stoch.stochK >= this.stoch.stochD);
        short.push(this.stoch.stochD > this.settings.stoch_up && this.stoch.stochK > this.settings.stoch_up && this.stoch.stochK <= this.stoch.stochD);
    };           
    if (this.settings.use_rsi) {
        long.push(this.rsi < this.settings.rsi_down);
        short.push(this.rsi > this.settings.rsi_up);
    };     
    if (this.settings.use_stochRSI) {
        long.push(this.stochRSI < this.settings.stochRSI_down && this.trend.persisted && this.trend.adviced);
        short.push(this.stochRSI > this.settings.stochRSI_up && this.trend.persisted && this.trend.adviced);
    };
    if (this.settings.use_sma) {
        long.push(this.smaTrend.direction != "descending" && this.smaTrend.persisted);
        // short.push(false);
        short.push(true);
    }
    if (this.settings.use_cci) {
        long.push(this.cci < this.settings.cci_down);
        short.push(this.cci > this.settings.cci_up);
    };
    if (this.settings.use_adx) {
        long.push(this.adx < this.settings.adx_down);
        short.push(this.adx > this.settings.adx_up);
    };
    if (this.settings.use_macd) {
        long.push((this.macdTrend.direction == 'up' || this.macdTrend.direction == 'none') && this.macdTrend.persisted);
        short.push((this.macdTrend.direction == 'down' || this.macdTrend.direction == 'none') && this.macdTrend.persisted);
    };

    if (this.settings.use_roc) {
        long.push(this.roc < this.settings.roc_down);
        short.push(this.roc > this.settings.roc_up);
    };


    const all_long = long.reduce((total, long)=>long && total, true);
    const all_short = short.reduce((total, long)=>long && total, true);
    
    // Торговать только на разрешенных трендах

    if ((this.settings.botActivity == "uptrend" && this.macdTrend.direction == "up" 
        || this.settings.botActivity == "downtrend" && this.macdTrend.direction == "down" 
        || this.settings.botActivity == "notrend" && this.macdTrend.direction == "none") && this.macdTrend.persisted
        || this.settings.botActivity == "all") {
        log.debug(this.settings.botActivity);
        log.debug(this.macdTrend.direction);
        // combining all indicators with AND
        if (all_long) {
            advice('long', this);
        } else if (
            all_short 
            && (
                (this.profit >= 0 && (this.profit >= this.settings.minProfit)) 
                || (
                    this.profit < 0 
                    && this.settings.negativeProfit == 1 
                    && (
                        this.settings.negativeProfitLimit == 0 
                        || (
                            this.settings.negativeProfitLimit != 0 
                            && this.profit > this.settings.negativeProfitLimit
                            )
                        )
                    )
                )
            ) {
            advice('short', this);
        } else {
            this.advice();
        }
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
    } else if (position == 'long') {
        candle.advice('long');

        if (candle.previousSellPrice > 0 || candle.previousSellPrice === false) {
            debug();
            candle.previousBuyPrice = candle.candle.close;
            candle.previousSellPrice = 0;
        }
    } else {
        candle.advice('');
    }

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
        Tulip StochD: ${candle.stoch.stochD}
        Tulip StochK: ${candle.stoch.stochK}
        Tulip MACD: ${candle.macd.macd}
        Tulip MACD Signal: ${candle.macd.macdSignal}
        Tulip MACD Histogram: ${candle.macd.macdHistogram}
        Tulip MACD Trend: ${candle.macdTrend.direction}
        Tulip MACD persisted: ${candle.macdTrend.persisted}
        Tulip RSI: ${candle.rsi}
        Tulip StochRSI: ${candle.stochRSI}
        Tulip SMA: ${candle.sma}
        SMA percent: ${candle.smaTrend.smaPercent}
        SMA direction: ${candle.smaTrend.direction}
        SMA persisted: ${candle.smaTrend.persisted}
        Tulip ROC: ${candle.roc}
        Tulip CCI: ${candle.cci}
        Tulip ADX: ${candle.adx}
        `);
    }
}
module.exports = method;
