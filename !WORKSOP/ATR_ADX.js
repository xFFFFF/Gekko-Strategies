/*
	ATR ADX Adaptive Strategy for gekko
  Built to immitate this script:https://www.tradingview.com/script/H48yeyRa-Adaptive-ATR-ADX-Trend-V2/
	-
	(CC-BY-SA 4.0) Rowan Griffin
	https://creativecommons.org/licenses/by-sa/4.0/
*/

// req's
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();
var _ = require('lodash');
var fs = require('fs');

// strategy
var strat = {

  /* INIT */
  init: function() {
    // core
    this.name = 'Adaptive ATR ADX';
    this.requiredHistory = config.tradingAdvisor.historySize;

    // debug? set to false to disable all logging/messages/stats (improves performance in backtests)
    this.debug = false;
    this.writeToFile = false;

    // performance
    config.backtest.batchSize = 1000; // increase performance
    config.silent = true;
    config.debug = false;


    // Heiken Ashi candle
    this.HACandle;
    false
    this.previousCandle = { //Initialise previousCandle with 0
      "open": 0,
      "close": 0,
      "high": 0,
      "low": 0
    };

    // ATR
    this.addTulipIndicator('ATR', 'atr', {
      optInTimePeriod: this.settings.ATR
    });

    // ADX
    this.addTulipIndicator('ADX', 'adx', {
      optInTimePeriod: this.settings.ADX
    })

    //Directional Indicator - Needed to decide initial long or short position on strat start
    this.addTulipIndicator('DI', 'di', {
      optInTimePeriod: this.settings.ADX //matches the ADX period
    })

    //High and low
    this.highs = new Array(this.settings.ATR);
    this.lows = new Array(this.settings.ATR);
    this.arrayCounter = 0; // to track array position
    this.periodMax = 0;
    this.periodMin = 0;

    //Variables
    this.trend = 'none';
    this.newTrend = false;
    this.stop = 0;



    //ATR Level Modifiers
    this.ATR_threshold = this.settings.ATR_threshold;
    // this.ATR_Multiplier_high = this.settings.ATR_Multiplier_high;
    // this.ATR_Multiplier_low = this.settings.ATR_Multiplier_low;


    // debug stuff
    this.startTime = new Date();


    /* MESSAGES */

    // message the user about required history
    log.info("====================================");
    log.info('Running', this.name);
    log.info('====================================');
    log.info("Make sure your warmup period matches the longer of ATR or ADX and that Gekko downloads data if needed");

    // warn users
    if (this.requiredHistory < this.settings.ATR || this.requiredHistory < this.settings.ATR) {
      log.warn("*** WARNING *** Your Warmup period is lower than ATR|ADX. If Gekko does not download data automatically when running LIVE the strategy will not behave as expected");
    }

  }, // init()

  heikenAshi: function(candle) {
    return {
      close: (candle.open + candle.close + candle.high + candle.low) / 4,
      open: (this.previousCandle.open + this.previousCandle.close) / 2,
      high: _.max([candle.high, candle.open, candle.close]),
      low: _.min([candle.low, candle.open, candle.close])
    };
  },

  updateMinMax: function(candle) {
    //Gets the minimum and maximum trade price from the last ATR Period

    // Add latest high and low to arrays at counter index
    this.lows[this.arrayCounter] = candle.low;
    this.highs[this.arrayCounter] = candle.high;
    //increment index
    this.arrayCounter = this.arrayCounter + 1;

    if (this.arrayCounter === this.settings.ATR) { //reset index if at array length
      this.arrayCounter = 0;
    }

    //Set newest period max and min
    this.periodMax = Math.max.apply(Math, this.highs);
    this.periodMin = Math.min.apply(Math, this.lows);

  },

  updateMinMaxAverage: function(candle) {
    //same as above except it outputs the average low/high instead of the min/max

    // Add latest high and low to arrays at counter index
    this.lows[this.arrayCounter] = candle.low;
    this.highs[this.arrayCounter] = candle.high;
    //increment index
    this.arrayCounter = this.arrayCounter + 1;

    if (this.arrayCounter === this.settings.ATR) { //reset index if at array length
      this.arrayCounter = 0;
    }

    let averageMin = 0,
      averageMax = 0;

    for (let i in this.lows) {
      averageMin += this.lows[i];
      averageMax += this.highs[i];
    }

    //Set newest period max and min
    this.periodMax = averageMin / this.lows.length;
    this.periodMin = averageMax / this.highs.length;

  },

  resetMinMax: function() {
    // Resets the minimum and maximum arrays.
    // Thought is that doing this each trade limits the effect of past data that is no longer that relevant
    for (var i in this.lows) {
      this.lows[i] = this.HACandle.low;
      this.highs[i] = this.HACandle.high;
    }
  },

  getBullMultiplier: function(adx) {
    // Returns the correct Bull multiplier depending on ADX value
    if (adx < this.ATR_threshold) {
      return this.settings.BULL_Multiplier_high;
    } else {
      return this.settings.BULL_Multiplier_low;
    }
  },

  getBearMultiplier: function(adx) {
    // Returns the correct Bear multiplier depending on ADX value
    if (adx < this.ATR_threshold) {
      return this.settings.BEAR_Multiplier_high;
    } else {
      return this.settings.BEAR_Multiplier_low;
    }
  },

  //called on each new candle, before check.
  update: function(candle) {
    // this.updateMinMax(candle);
    this.HACandle = this.heikenAshi(candle);
    this.updateMinMax(this.HACandle);
    // this.updateMinMaxAverage(this.HACandle);
    this.previousCandle = candle; //for HA calculation
  },


  /* CHECK */
  check: function() {
    // get all indicators
    let ind = this.tulipIndicators,
      atr = ind.ATR.result.result,
      adx = ind.ADX.result.result,
      di = ind.DI.result,
      price = this.HACandle.close;

    //Reset the min max if the trend is new
    if (this.newTrend) {
      this.resetMinMax(this.HACandle);
    }

    if (adx !== undefined) {
      //Check for long
      if (this.trend === 'bull') {
        //Calculate new stop target

        //Bull trend so stop needs to be below the trendline.
        let newStop = this.periodMax - (atr * this.getBullMultiplier(adx))

        // Stop can only increase, therefore only use the new stop if it is higher than current stop
        // If trend is new, bull stop will never be higher than bear stop, therefore use it anyway.
        if (newStop > this.stop) {
          this.stop = newStop;
        }
        if (this.newTrend) {
          // this.stop = this.periodMin;
          this.stop = newStop;
          this.newTrend = false;
        }
        //If candle close price has passed the latest stop, change advice to short
        if (price <= this.stop) {
          this.short();
        }


      } else if (this.trend === 'bear') {
        //Calculate new stop target
        let newStop = this.periodMin + (atr * this.getBearMultiplier(adx))

        if (newStop < this.stop) {
          this.stop = newStop;
        }

        if (this.newTrend) {
          // this.stop = this.periodMax;
          this.stop = newStop;
          this.newTrend = false;
        }

        //check if price has hit target
        if (price >= this.stop) {
          this.long();
        }
      }
    }


    // This will only run on the very first candle. Buys if current trend is bull, sells if bear.
    else if (this.trend === 'none') {
      if (di.plus_di > di.minus_di) { //BULL
        this.long();
      } else {
        this.short();
      }
    }

    if (this.debug) {
      log.info('Current Trend: ' + this.trend);
      log.info('Period Min: ' + this.periodMin);
      log.info('Period Max: ' + this.periodMax);
      log.info('Current Stop: ' + this.stop);
      log.info('Current Price: ' + price);
      log.info('\n\n');
    }

    if (this.writeToFile) {
      log.info('Writing ' + price.toFixed(2) + "," + this.stop.toFixed(2));

      fs.appendFile('ResultsLog/results ' + this.startTime + '.csv', price + "," + this.stop + "," + this.periodMin + "," + this.periodMax + "\n", function(err) {
        if (err) {
          return console.log(err);
        }
      });


      // fs.writeFile(this.fileName, price.toFixed(2) + "," + this.stop.toFixed(2) + "\n\r", function(err) {
      //   if (err) {
      //     return console.log(err);
      //   }
      // });
    }


  }, // check()

  /* LONG */
  long: function() {
    if (this.trend !== 'bull') // new trend? (only act on new trends)
    {
      this.trend = 'bull';
      this.newTrend = true;
      this.advice('long');
    }
  },

  /* SHORT */
  short: function() {
    // new trend? (else do things)
    if (this.trend !== 'bear') {
      this.trend = 'bear';
      this.newTrend = true;
      this.advice('short');
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

  }

};

module.exports = strat;