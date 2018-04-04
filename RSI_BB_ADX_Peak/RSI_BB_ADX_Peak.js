// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies
// Source: https://github.com/RJPGriffin/
/*
	RSI Bull and Bear + ADX modifier
	1. Use different RSI-strategies depending on a longer trend
	2. But modify this slighly if shorter BULL/BEAR is detected
	-
	12 feb 2017
	-
	(CC-BY-SA 4.0) Tommie Hansen
	https://creativecommons.org/licenses/by-sa/4.0/
*/

// req's
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();

// strategy
var strat = {

  /* INIT */
  init: function() {
    this.name = 'RSI Bull and Bear + ADX';
    this.requiredHistory = config.tradingAdvisor.historySize;
    this.resetTrend();

    // debug? set to flase to disable all logging/messages/stats (improves performance)
    this.debug = false;
    config.backtest.batchSize = 20000 //reduce db reads

    //GA Settings CHECK
    log.debug('SMA Long: ' + this.settings.SMA_long);
    log.debug('SMA Short: ' + this.settings.SMA_short);
    log.debug('Bull RSI: ' + this.settings.BULL_RSI);
    log.debug('Bear RSI: ' + this.settings.BEAR_RSI);

    // performance
    config.backtest.batchSize = 1000; // increase performance
    config.silent = true;
    config.debug = false;

    // SMA
    this.addTulipIndicator('maSlow', 'sma', {
      optInTimePeriod: this.settings.SMA_long
    });
    this.addTulipIndicator('maFast', 'sma', {
      optInTimePeriod: this.settings.SMA_short
    });

    // RSI
    this.addTulipIndicator('BULL_RSI', 'rsi', {
      optInTimePeriod: this.settings.BULL_RSI
    });
    this.addTulipIndicator('BEAR_RSI', 'rsi', {
      optInTimePeriod: this.settings.BEAR_RSI
    });

    // ADX
    this.addTulipIndicator('ADX', 'adx', {
      optInTimePeriod: this.settings.ADX
    })

    // Previous RSI value
    this.lastBearRsi = 50;
    this.lastBullRsi = 50;

    // MOD (RSI modifiers)
    this.BULL_MOD_high = this.settings.BULL_MOD_high;
    this.BULL_MOD_low = this.settings.BULL_MOD_low;
    this.BEAR_MOD_high = this.settings.BEAR_MOD_high;
    this.BEAR_MOD_low = this.settings.BEAR_MOD_low;

    // Stop Loss
    this.lastLongPrice = 0; // start at 0


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
  check: function(candle) {
    // get all indicators
    let ind = this.tulipIndicators,
      maSlow = ind.maSlow.result.result,
      maFast = ind.maFast.result.result,
      rsi,
      adx = ind.ADX.result.result;


    if (candle.close < this.lastLongPrice * (this.settings.Stop_Loss_Percent / 100)) {
      this.short();
    }
    // BEAR TREND
    else if (maFast < maSlow) {
      rsi = ind.BEAR_RSI.result.result;
      let rsi_hi = this.settings.BEAR_RSI_high,
        rsi_low = this.settings.BEAR_RSI_low;

      // ADX trend strength?
      if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BEAR_MOD_high;
      else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BEAR_MOD_low;

      if (rsi > rsi_hi && rsi <= this.lastBearRsi) this.short();
      else if (rsi < rsi_low && rsi >= this.lastBearRsi) this.long(candle);

      if (this.debug) this.lowHigh(rsi, 'bear');
      this.lastBearRsi = rsi;
    }

    // BULL TREND
    else {
      rsi = ind.BULL_RSI.result.result;
      let rsi_hi = this.settings.BULL_RSI_high,
        rsi_low = this.settings.BULL_RSI_low;

      // ADX trend strength?
      if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BULL_MOD_high;
      else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BULL_MOD_low;


      if (rsi > rsi_hi && rsi <= this.lastBullRsi) this.short(); // && RSI no longer increasing.
      else if (rsi < rsi_low && rsi >= this.lastBullRsi) this.long(candle); //&& RSI no longer decreasing
      if (this.debug) this.lowHigh(rsi, 'bull');
      this.lastBullRsi = rsi;
    }

    // add adx low/high if debug
    if (this.debug) this.lowHigh(adx, 'adx');



  }, // check()


  /* LONG */
  long: function(candle) {
    if (this.trend.direction !== 'up') // new trend? (only act on new trends)
    {
      this.resetTrend();
      this.trend.direction = 'up';
      this.advice('long');
      this.lastLongPrice = candle.close;
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