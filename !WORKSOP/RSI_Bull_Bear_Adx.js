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
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();

// strategy
var strat = {

  /* INIT */
  init: function() {
    // core
    this.name = 'RSI Bull and Bear + ADX';
    this.requiredHistory = config.tradingAdvisor.historySize;
    this.resetTrend();

    // debug? set to false to disable all logging/messages/stats (improves performance in backtests)
    this.debug = false;

    // performance
    config.backtest.batchSize = 1000; // increase performance
    config.silent = true; // NOTE: You may want to set this to 'false' @ live
    config.debug = false;

    // SMA
    this.addIndicator('maSlow', 'SMA', this.settings.SMA_long);
    this.addIndicator('maFast', 'SMA', this.settings.SMA_short);

    // RSI
    this.addIndicator('BULL_RSI', 'RSI', {
      interval: this.settings.BULL_RSI
    });
    this.addIndicator('BEAR_RSI', 'RSI', {
      interval: this.settings.BEAR_RSI
    });

    // ADX
    this.addIndicator('ADX', 'ADX', this.settings.ADX);

    // MOD (RSI modifiers)
    this.BULL_MOD_high = this.settings.BULL_MOD_high;
    this.BULL_MOD_low = this.settings.BULL_MOD_low;
    this.BEAR_MOD_high = this.settings.BEAR_MOD_high;
    this.BEAR_MOD_low = this.settings.BEAR_MOD_low;


    // debug stuff
    this.startTime = new Date();

    // add min/max if debug
    if (this.debug) {
      this.stat = {
        adx: {
          min: 1000,
          max: 0
        },
        bear: {
          min: 1000,
          max: 0
        },
        bull: {
          min: 1000,
          max: 0
        }
      };
    }

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
      direction: 'none',
      longPos: false,
    };

    this.trend = trend;
  },


  /* get low/high for backtest-period */
  lowHigh: function(val, type) {
    let cur;
    if (type == 'bear') {
      cur = this.stat.bear;
      if (val < cur.min) this.stat.bear.min = val; // set new
      else if (val > cur.max) this.stat.bear.max = val;
    } else if (type == 'bull') {
      cur = this.stat.bull;
      if (val < cur.min) this.stat.bull.min = val; // set new
      else if (val > cur.max) this.stat.bull.max = val;
    } else {
      cur = this.stat.adx;
      if (val < cur.min) this.stat.adx.min = val; // set new
      else if (val > cur.max) this.stat.adx.max = val;
    }
  },


  /* CHECK */
  check: function() {
    // get all indicators
    let ind = this.indicators,
      maSlow = ind.maSlow.result,
      maFast = ind.maFast.result,
      rsi,
      adx = ind.ADX.result;

    // BEAR TREND
    // NOTE: maFast will always be under maSlow if maSlow can't be calculated
    if (maFast < maSlow) {
      rsi = ind.BEAR_RSI.result;
      let rsi_hi = this.settings.BEAR_RSI_high,
        rsi_low = this.settings.BEAR_RSI_low;

      // ADX trend strength?
      if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BEAR_MOD_high;
      else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BEAR_MOD_low;

      if (rsi > rsi_hi) this.short();
      else if (rsi < rsi_low) this.long();

      if (this.debug) this.lowHigh(rsi, 'bear');
    }

    // BULL TREND
    else {
      rsi = ind.BULL_RSI.result;
      let rsi_hi = this.settings.BULL_RSI_high,
        rsi_low = this.settings.BULL_RSI_low;

      // ADX trend strength?
      if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BULL_MOD_high;
      else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BULL_MOD_low;

      if (rsi > rsi_hi) this.short();
      else if (rsi < rsi_low) this.long();
      if (this.debug) this.lowHigh(rsi, 'bull');
    }

    // add adx low/high if debug
    if (this.debug) this.lowHigh(adx, 'adx');

  }, // check()


  /* LONG */
  long: function() {
    if (this.trend.direction !== 'up') // new trend? (only act on new trends)
    {
      this.resetTrend();
      this.trend.direction = 'up';
      this.advice('long');
      if (this.debug) log.info('Going long');
    }

    if (this.debug) {
      this.trend.duration++;
      log.info('Long since', this.trend.duration, 'candle(s)');
    }
  },


  /* SHORT */
  short: function() {
    // new trend? (else do things)
    if (this.trend.direction !== 'down') {
      this.resetTrend();
      this.trend.direction = 'down';
      this.advice('short');
      if (this.debug) log.info('Going short');
    }

    if (this.debug) {
      this.trend.duration++;
      log.info('Short since', this.trend.duration, 'candle(s)');
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
    }

  }

};

module.exports = strat;