/*
	Export data to .csv
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
    this.name = 'CSV Export';
    this.requiredHistory = 0;
    this.startTime = new Date();

    // debug? set to false to disable all logging/messages/stats (improves performance in backtests)
    this.debug = false;
  }, // init()


  //called on each new candle, before check.
  update: function(candle) {
    fs.appendFile('Data Exports/' + this.settings.Asset + ':' + this.settings.Currency + ' ' + this.startTime + '.csv', candle.high + "," + candle.low + "," + candle.close + "," + candle.volume + "," + candle.trades + "\n", function(err) {
      if (err) {
        return console.log(err);
      }
    });

  },


  /* CHECK */
  check: function() {}, // check()


  /* END backtest */
  end: function() {

  }

};

module.exports = strat;