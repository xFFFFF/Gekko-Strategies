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



// TODO
// Stoploss is not working properly - maybe not resetting?
// TODO


// req's
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();
var RSI = require('./indicators/RSI.js')
var ADX = require('./indicators/ADX.js')
var SMA = require('./indicators/SMA.js')

// strategy
var strat = {

  /* INIT */
  init: function() {
    // core
    this.name = 'RSI Bull and Bear + BBands + ADX';
    this.requiredHistory = config.tradingAdvisor.historySize;

    // debug? set to false to disable all logging/messages/stats (improves performance in backtests)
    this.debug = true;

    // performance
    config.backtest.batchSize = 1000; // increase performance
    config.silent = true; // NOTE: You may want to set this to 'false' @ live
    config.debug = false;

    //Add Gekko Managed Indicators (M1 timeframe)

    //Short Term SMA/EMA
    this.addIndicator('fastMaFast', 'EMA', this.settings.fastMaFast);
    this.addIndicator('fastMaSlow', 'SMA', this.settings.fastMaFast + this.settings.fastMaDiff);

    //Add Custom Timeframe indicators
    //SMA
    this.maSlow = new SMA(this.settings.SMA_long);
    this.maFast = new SMA(this.settings.SMA_short)

    // RSI
    this.BULL_RSI = [];
    for (let i = 0; i < this.settings.BULL_RSI_Timeframe; i++) {
      this.BULL_RSI[i] = new RSI({
        interval: this.settings.BULL_RSI
      });
    }

    this.BEAR_RSI = [];
    for (let i = 0; i < this.settings.BEAR_RSI_Timeframe; i++) {
      this.BEAR_RSI[i] = new RSI({
        interval: this.settings.BEAR_RSI
      });
    }

    // ADX
    this.ADX = new ADX(this.settings.ADX);

    this.timeframes = {
      SMA: this.settings.SMA_Timeframe,
      SMA_Count: 0,
      BULL_RSI: this.settings.BULL_RSI_Timeframe,
      BULL_RSI_Count: 0,
      BEAR_RSI: this.settings.BEAR_RSI_Timeframe,
      BEAR_RSI_Count: 0,
      ADX: this.settings.ADX_Timeframe,
      ADX_Count: 0
    };

    // MOD (RSI modifiers)
    this.BULL_MOD_high = this.settings.BULL_MOD_high;
    this.BULL_MOD_low = this.settings.BULL_MOD_low;
    this.BEAR_MOD_high = this.settings.BEAR_MOD_high;
    this.BEAR_MOD_low = this.settings.BEAR_MOD_low;

    this.diffMax = 0;
    this.diffMin = 100;
    this.tradesDelayed = 0;
    this.callPrice = 0; //Price trade would ahve been made at
    this.delayedBuys = [];
    this.delayedSells = [];

    //Advice tracking object. Weighting signals allows adding extra indicators without adjusting hard trading logic.
    this.signals = {
      bull: {
        RSI: 0,
        BB: 0
      },
      bear: {
        RSI: 0,
        BB: 0
      },
      fastMaDiff: 0,
      intermediateAdvice: 'none'
    };

    this.stopLoss = {
      active: 'false',
      price: 0
    }

    this.resetTrend();


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
    this.signals.intermediateAdvice = 'none';
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

  //Update all of the non gekko managed indicators here
  update: function(candle) {
    tf = this.timeframes;
    if (tf.SMA_Count >= tf.SMA) {
      this.maSlow.update(candle.close);
      this.maFast.update(candle.close);
      tf.SMA_Count = 0;
    } else {
      tf.SMA_Count++;
    }

    if (tf.BULL_RSI_Count >= tf.BULL_RSI - 1) {
      tf.BULL_RSI_Count = 0;
    } else {
      tf.BULL_RSI_Count++;
    }
    this.BULL_RSI[tf.BULL_RSI_Count].update(candle);

    if (tf.BEAR_RSI_Count >= tf.BEAR_RSI - 1) {
      tf.BEAR_RSI_Count = 0;
    } else {
      tf.BEAR_RSI_Count++;
    }
    this.BEAR_RSI[tf.BEAR_RSI_Count].update(candle);

    if (tf.ADX_Count >= tf.ADX) {
      this.ADX.update(candle);
      tf.ADX_Count = 0;
    } else {
      tf.ADX_Count++;
    }



  },

  /* CHECK */
  check: function(candle) {
    // get all indicators
    let ind = this.indicators,
      maSlow = this.maSlow.result,
      maFast = this.maFast.result,
      rsi,
      market;
    fastMaFast = ind.fastMaFast.result;
    fastMaSlow = ind.fastMaSlow.result;
    price = candle.close,
      adx = this.ADX.result;

    this.signals.fastMaDiff = ((fastMaFast - fastMaSlow) / maSlow) * 100;
    //Tests indicate this fastMA can actually work, but needs to be done on shorter time frames than the main candles
    if (this.signals.fastMaDiff > this.diffMax) this.diffMax = this.signals.fastMaDiff;
    if (this.signals.fastMaDiff < this.diffMin) this.diffMin = this.signals.fastMaDiff;

    // log.debug('Fast Diference %: ' + this.signals.fastMaDiff);

    // BEAR TREND
    // NOTE: maFast will always be under maSlow if maSlow can't be calculated
    if (maFast < maSlow) {
      market = 'bear';
      rsi = this.BEAR_RSI[this.timeframes.BEAR_RSI_Count].result;
      let rsi_hi = this.settings.BEAR_RSI_high,
        rsi_low = this.settings.BEAR_RSI_low;

      // ADX trend strength?
      if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BEAR_MOD_high;
      else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BEAR_MOD_low;


      this.signals.bear.RSI = (rsi > rsi_hi) ? 1 : (rsi < rsi_low) ? -1 : 0;

      // if (rsi > rsi_hi && price >= bbands.middle) this.short();
      // else if (rsi < rsi_low && price <= bbands.lower) this.long();

      if (this.debug) this.lowHigh(rsi, 'bear');
    }

    // BULL TREND
    else {
      market = 'bull';
      rsi = this.BULL_RSI[this.timeframes.BULL_RSI_Count].result;
      let rsi_hi = this.settings.BULL_RSI_high,
        rsi_low = this.settings.BULL_RSI_low;

      // ADX trend strength?
      if (adx > this.settings.ADX_high) rsi_hi = rsi_hi + this.BULL_MOD_high;
      else if (adx < this.settings.ADX_low) rsi_low = rsi_low + this.BULL_MOD_low;

      this.signals.bull.RSI = (rsi > rsi_hi) ? 1 : (rsi < rsi_low) ? -1 : 0;

      // if (rsi > rsi_hi && price >= bbands.middle) this.short();
      // else if (rsi < rsi_low && price <= bbands.lower) this.long();
      if (this.debug) this.lowHigh(rsi, 'bull');
    }

    // add adx low/high if debug
    if (this.debug) this.lowHigh(adx, 'adx');

    if (this.settings.trailStop) {
      this.trailStopUpdate(fastMaFast);
    }

    this.checkStop(fastMaFast); //Use SMA to trigger stoploss to help prevent false triggers

    this.advise(market, candle);

  }, // check()

  trailStopUpdate: function(price) {
    let newStop = price - (price * (this.settings.stopLoss / 100));
    if (newStop > this.stopLoss.price) {
      this.stopLoss.price = newStop;
    }
  },

  checkStop: function(price) {
    if (this.trend.direction === 'up' && price < this.stopLoss.price && this.stopLoss.active === 'false') {
      if (this.debug) log.debug(`Stoploss Activated. Price is ${price.toFixed(4)}, Stoploss is ${this.stopLoss.price.toFixed(4)}`);
      log.debug(`Calling short for Stoploss`);
      this.short();
      this.stopLoss.active = 'true';
    }
  },

  advise: function(market, candle) {
    let signalScore, val;
    ind = this.indicators;
    fastMaFast = ind.fastMaFast.result;
    fastMaSlow = ind.fastMaSlow.result;

    if (market === 'bull') {
      val = this.signals.bull;
    } else {
      val = this.signals.bear;
    }

    signalScore = val.RSI // + val.BB;

    if (this.signals.intermediateAdvice === 'none') {
      if (signalScore <= -1) {
        // if (this.signals.fastMaDiff > this.settings.fastPercentCheck) {
        if (fastMaFast >= fastMaSlow) {
          this.long();
        } else if (this.trend.direction !== 'up') {
          this.tradesDelayed++;
          this.callPrice = candle.close;
          // log.debug('Delaying Buy, percent diff is: ' + this.signals.fastMaDiff.toFixed(3))
          // log.debug('Price is: ' + candle.close);
          this.signals.intermediateAdvice = 'long'
        }
      } else if (signalScore >= 1) {
        // if (this.signals.fastMaDiff < this.settings.fastPercentCheck) {
        if (fastMaFast <= fastMaSlow) {
          this.short();
        } else if (this.trend.direction !== 'down') {
          this.tradesDelayed++;
          this.callPrice = candle.close;
          // log.debug('Delaying Sell, percent diff is: ' + this.signals.fastMaDiff.toFixed(3))
          // log.debug('Price is: ' + candle.close);
          this.signals.intermediateAdvice = 'short';
        }
      }
    } else if (this.signals.intermediateAdvice === 'long') {
      if (fastMaFast >= fastMaSlow) {
        // log.debug('Completing Delayed Buy, percent diff is: ' + this.signals.fastMaDiff.toFixed(3));
        let benefit = (100 - (candle.close / this.callPrice) * 100);
        // log.debug('Price Benefit: ' + benefit);
        this.delayedBuys.push(benefit);
        this.long();
      }
    } else if (this.signals.intermediateAdvice === 'short') {
      if (fastMaFast <= fastMaSlow) {
        // log.debug('Completing Delayed Sell, percent diff is: ' + this.signals.fastMaDiff.toFixed(3));
        // log.debug('Price is: ' + candle.close);
        let benefit = (100 - (this.callPrice / candle.close) * 100);
        // log.debug('Price Benefit: ' + benefit);
        this.delayedSells.push(benefit);
        this.short();
      }
    }



  },

  /* LONG */
  long: function() {
    // log.info('Entering Long. Trend Direction is: ' + this.trend.direction);
    if (this.trend.direction !== 'up' && this.stopLoss.active === 'false') // new trend? (only act on new trends)
    {
      this.resetTrend();
      this.trend.direction = 'up';
      let newStop = price - (price * (this.settings.stopLoss / 100));
      if (this.debug) log.info(`Setting Stoploss. Price is ${price.toFixed(4)}, Stoploss is ${newStop.toFixed(4)}`);
      // if (this.debug) log.info('Setting Stoploss.');
      this.stopLoss.price = newStop;
      this.advice('long');
      if (this.debug) log.info('Going long');
    }

    if (this.debug) {
      this.trend.duration++;
      // log.info('Long since', this.trend.duration, 'candle(s)');
    }
  },


  /* SHORT */
  short: function() {
    // new trend? (else do things)
    // log.info('Entering Short. Trend Direction is: ' + this.trend.direction);
    log.debug('Entering Short');
    if (this.stopLoss.active === 'true') {
      log.debug(`Resetting Stoploss`);
      this.stopLoss.active = 'false';
    } else if (this.trend.direction !== 'down') {
      this.resetTrend();
      this.trend.direction = 'down';
      this.advice('short');
      if (this.debug) log.info('Going short');
    }

    if (this.debug) {
      this.trend.duration++;
      // log.info('Short since', this.trend.duration, 'candle(s)');
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

    let buyBenefit = 0
    for (i = 0; i < this.delayedBuys.length; i++) {
      buyBenefit += this.delayedBuys[i];
    }
    buyBenefit = buyBenefit / this.delayedBuys.length;

    let sellBenefit = 0
    for (i = 0; i < this.delayedSells.length; i++) {
      sellBenefit += this.delayedSells[i];
    }
    sellBenefit = buyBenefit / this.delayedSells.length;

    log.info('Max Diff: ' + this.diffMax);
    log.info('Min Diff: ' + this.diffMin);
    log.info('Trades Delayed: ' + this.tradesDelayed);
    log.info(`Avg Sell Improvement: ${sellBenefit}`);
    log.info(`Avg Buy Improvement: ${buyBenefit}`);

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