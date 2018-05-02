/*
    RSI Bull and Bear + ADX modifier
    1. Use different RSI-strategies depending on a longer trend
    2. But modify this slighly if shorter BULL/BEAR is detected
    -
    (CC-BY-SA 4.0) Tommie Hansen
    https://creativecommons.org/licenses/by-sa/4.0/
	-
	NOTE: Requires custom indicators found here:
	https://github.com/Gab0/Gekko-extra-indicators
	(c) Gabriel Araujo
	Howto: Download + add to gekko/strategies/indicators
*/
// req's
var util = require('../core/util.js');
var mode = util.gekkoMode();

var log = require('../core/log.js');
var config = util.getConfig();
var moment = require('moment');
var _ = require('lodash');

var path = require('path');
var fs = require('fs-extra');


// strategy
var strat = {

    /* INIT */
    init: function() {
        this.name = 'RSI Bull and Bear + ADX';
        this.requiredHistory = config.tradingAdvisor.historySize;
        this.resetTrend();

        // debug? set to false to disable all logging/messages/stats (improves performance in backtests)
        this.debug = false;
        this.info = true;

        if(mode == 'backtest') {
            log.info('gekko in backtest mode.');
            this.debug = this.info = false;
            config.silent = config.debug = false;
        }

        // performance
        config.backtest.batchSize = 1000; // increase performance
        //config.silent = true;
        //config.debug = true;

        // SMA
		this.addIndicator('maSlow', 'SMA', this.settings.SMA_long );
		this.addIndicator('maFast', 'SMA', this.settings.SMA_short );

        // RSI
		this.addIndicator('BULL_RSI', 'RSI', { interval: this.settings.BULL_RSI });
		this.addIndicator('BEAR_RSI', 'RSI', { interval: this.settings.BEAR_RSI });

        // ADX
		this.addIndicator('ADX', 'ADX', this.settings.ADX );

        // MOD (RSI modifiers)
        this.BULL_MOD_high = this.settings.BULL_MOD_high || 5;
        this.BULL_MOD_low = this.settings.BULL_MOD_low || -5;
        this.BEAR_MOD_high = this.settings.BEAR_MOD_high || 15;
        this.BEAR_MOD_low = this.settings.BEAR_MOD_low || -5;

        // debug stuff
        this.startTime = new Date();

        // add min/max if debug
        if (this.debug) {
            this.stat = {
                adx: { min: 1000, max: 0 },
                bear: { min: 1000, max: 0 },
                bull: { min: 1000, max: 0 },
                bear_count: 0,
                bull_count: 0
            };
        }

        //WK
        this.mode = 'none';
        this.lasttime = new Date();

        this.config = {
            minProfit: Number(this.settings.minProfit),
            quitBelow: Number(this.settings.quitBelow, 10),
        };
        this.cache = this.writeUpdates({ version: 1 });

        /* MESSAGES */
        // message the user about required history
        log.info("====================================");
        log.info('Running', this.name);
        log.info('====================================');
        log.info("Make sure your warmup period matches SMA_long and that Gekko downloads data if needed");

        // warn users
        if (this.requiredHistory < this.settings.SMA_long) {
            log.warn("*** WARNING *** Your Warmup period is lower then SMA_long. If Gekko does not download data automatically when running LIVE the strategy will default to BEAR-mode until it has enough data.");
        }

    }, // init()

    /* RESET TREND */
    resetTrend: function() {
        var trend = {
            duration: 0,
            persisted: false,
            adviced: false,
            direction: 'no',
        };

        this.trend = trend;
    },

    //JSON: {"version":1,"lastAction":"sell","lastBuyPrice":54490,"lastSellPrice":54132}
    writeUpdates: function(updates) {
        let rsi_cache = this.settings.cachefile || 'rsi_cache';
        let name = path.join(__dirname, 'cache', `${rsi_cache}.json`);
        fs.ensureFileSync(name);
        let current = {};
        try {
            current = fs.readJsonSync(name);
        } catch (error) {
            log.error(error.message);
        } finally {
            const updated = Object.assign(current, updates);
            fs.writeJsonSync(name, updated, 'utf8');
            return updated;
        }
    },

    saveBuy: function(price) {
        this.cache = this.writeUpdates({
            lastAction: 'buy',
            lastBuyPrice: price
        });
    },

    saveSell: function(price) {
        this.cache = this.writeUpdates({
            lastAction: 'sell',
            lastSellPrice: price
        });
    },

    onTrade: function(event) {
        log.debug(this.name, "onTrade:", event.action, 'completed @', event.price);
        if ('buy' === event.action) {
            this.saveBuy(event.price);
        } else
        if ('sell' === event.action) {
            this.saveSell(event.price);
        }
    },

    /* get low/high for backtest-period */
    lowHigh: function(val, type) {
        let cur;
        if (type == 'bear') {
            if (this.debug) this.stat.bear_count++;
            cur = this.stat.bear;
            if (val < cur.min) this.stat.bear.min = val; // set new
            else if (val > cur.max) this.stat.bear.max = val;
        } else if (type == 'bull') {
            if (this.debug) this.stat.bull_count++;
            cur = this.stat.bull;
            if (val < cur.min) this.stat.bull.min = val; // set new
            else if (val > cur.max) this.stat.bull.max = val;
        } else {
            cur = this.stat.adx;
            if (val < cur.min) this.stat.adx.min = val; // set new
            else if (val > cur.max) this.stat.adx.max = val;
        }
    },

    /* Log */
    showlog: function(adx, rsi_low, rsi_hi) {
        let maslow = this.indicators.maSlow.result,
            mafast = this.indicators.maFast.result,
            bullrsi = this.indicators.BULL_RSI.result,
            bearrsi = this.indicators.BEAR_RSI.result;

        if (!_.isUndefined(maslow))
            maslow = maslow.toFixed(0);
        if (!_.isUndefined(mafast))
            mafast = mafast.toFixed(0);
        if (!_.isUndefined(bullrsi))
            bullrsi = bullrsi.toFixed(2);
        if (!_.isUndefined(bearrsi))
            bearrsi = bearrsi.toFixed(2);
        if (!_.isUndefined(adx))
            adx = adx.toFixed(2);

        if(this.info) log.info('Calculated', this.name, 'modifier:' +
            '\n                                    mafast < maslow: ', mafast, '<', maslow, mafast < maslow ? ' BEAR' : ' BULL',
            '\n                                    ADX Level:  LOW ', this.settings.ADX_low, '<', adx, '>', this.settings.ADX_high, 'HIGH' +
            '\n                                    RSI Level:  LOW ', rsi_low, '<', this.mode === 'Bull' ? bullrsi : bearrsi, '>', rsi_hi, 'HIGH' +
            //'\n                                     BULL_RSI:', bullrsi, ' BEAR_RSI:', bearrsi + '' +
            '\n                                [' + this.mode + ']', 'mode in', '[' + this.trend.direction + ']', 'trend since', moment(this.lasttime).calendar());
    }, // showlog()

    /* CHECK */
    check: function(candle) {
        // get all indicators
        let ind = this.indicators,
            maSlow = ind.maSlow.result,
            maFast = ind.maFast.result,
            rsi,
            adx = ind.ADX.result,
            rsi_hi = rsi_low = 0;

        // BEAR TREND
        if (maFast < maSlow) {
            this.mode = 'Bear';

            rsi = ind.BEAR_RSI.result;
            rsi_hi = this.settings.BEAR_RSI_high;
            rsi_low = this.settings.BEAR_RSI_low;

            // ADX trend strength?
            if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BEAR_MOD_high;
            else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BEAR_MOD_low;

            if (rsi > rsi_hi) this.short(candle);
            else if (rsi < rsi_low) this.long(candle);

            if (this.debug) this.lowHigh(rsi, 'bear');
        }

        // BULL TREND
        else {
            this.mode = 'Bull';

            rsi = ind.BULL_RSI.result;
            rsi_hi = this.settings.BULL_RSI_high;
            rsi_low = this.settings.BULL_RSI_low;

            // ADX trend strength?
            if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BULL_MOD_high;
            else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BULL_MOD_low;

            if (rsi > rsi_hi) this.short(candle);
            else if (rsi < rsi_low) this.long(candle);
            if (this.debug) this.lowHigh(rsi, 'bull');
        }

        // add adx low/high if debug
        if (this.debug) this.lowHigh(adx, 'adx');

        this.showlog(adx, rsi_low, rsi_hi);
    }, // check()

    /* LONG/BUY */
    long: function(candle) {

        const time = candle.start.format("YYYY-MM-DD HH:mm:ss");
        const price = Number(candle.close);

        if (this.trend.direction !== 'long') {
            this.resetTrend();
            this.trend.direction = 'long';
            this.lasttime = new Date();
        }
        this.trend.duration++;

        if (this.trend.duration >= this.settings.persistence)
            this.trend.persisted = true;

        if (this.trend.persisted && !this.trend.adviced) {
            if(_.isUndefined(this.cache.lastAction)) this.cache.lastAction = 'sell';
            // console.log('lastacton',this.cache.lastAction);
            if (this.cache.lastAction == 'sell') {
                this.trend.adviced = true;
                this.advice('long');
                this.saveBuy(candle.close);
                if(this.info) log.info(`(${time}) Buying at: ${price}`);
            }
        }
        if (this.debug) { log.info('Long since', this.trend.duration, 'candle(s)'); }


        // const percentage = this.getPercentage(this.cache.lastBuyPrice, candle.close);

        //else if (percentage < this.config.quitBelow) {
        //    log.info('During Buy Losses more than', this.config.quitBelow, '%. Selling...');
        //    this.trend.adviced = true;
        //    this.advice('short');
        //    this.saveSell(candle.close);
        //    log.info(`Selling at: ${price} (${time}) (${percentage.toFixed(2)}%)`);
        //}

    },

    getPercentage: function(start, end) {
        const W = end - start;
        return Number((W * 100) / end);
    },

    /* SHORT/SELL */
    short: function(candle) {
        const time = candle.start.format("YYYY-MM-DD HH:mm:ss");
        const price = Number(candle.close);
        const percentage = this.getPercentage(this.cache.lastBuyPrice, candle.close);

        if (this.trend.direction !== 'short') {
            this.resetTrend();
            this.trend.direction = 'short';
            this.lasttime = new Date();
        }
        this.trend.duration++;

        if (this.trend.duration >= this.settings.persistence)
            this.trend.persisted = true;

        if (this.trend.persisted && !this.trend.adviced) {
            const isHigher = (candle.close > this.cache.lastBuyPrice);
            const isProfitable = (percentage > this.config.minProfit);

            if (isHigher && isProfitable) {
                this.trend.adviced = true;
                this.advice('short');
                this.saveSell(candle.close);
                if(this.info) log.info(`(${time}) Selling at: ${this.cache.lastBuyPrice} ${price} (+${percentage.toFixed(2)}%)`);

            } else if (this.config.quitBelow > percentage) {
                this.trend.adviced = true;
                this.advice('short');
                this.saveSell(candle.close);
                if(this.info) log.info('Losses more than', this.config.quitBelow, '%. Selling...');
                if(this.info) log.info(`(${time}) Selling at: ${this.cache.lastBuyPrice} ${price} (${percentage.toFixed(2)}%)`);

            } else {
                //if(this.info) log.info('Not selling', percentage.toFixed(2), 'price below ' + this.config.minProfit + '%');
            }
        }
    },

    /* END backtest */
    end: function() {
        let seconds = ((new Date() - this.startTime) / 1000),
            minutes = seconds / 60,
            str;

        minutes < 1 ? str = seconds.toFixed(2) + ' seconds' : str = minutes.toFixed(2) + ' minutes';

        log.info('====================================');
        log.info('Finished in ' + str);
        log.info('====================================');

        // print stats and messages if debug
        if (this.debug) {
            let stat = this.stat;
            log.info('BEAR RSI low/high: ' + stat.bear.min + ' / ' + stat.bear.max);
            log.info('BULL RSI low/high: ' + stat.bull.min + ' / ' + stat.bull.max);
            log.info('ADX min/max: ' + stat.adx.min + ' / ' + stat.adx.max);
            log.info('Candles in Bear: ' + stat.bear_count);
            log.info('Candles in Bull: ' + stat.bull_count);
        }

    }

};

module.exports = strat;
