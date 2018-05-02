/* ICG Bot 1
   9/24/17
   For basic functionality and 
   operation testing
*/

// Helpers
var _ = require('lodash');
var log = require('../core/log');

// configuration
var config = require('../core/util.js').getConfig();
// Add indicator settings as:
// var xxxsettings = config.XXX;
var settings = config.DEMA;
var ccisettings = config.CCI;
var pposettings = config.PPO;
var macdsettings = config.MACD;

// Create our strat
var strategy = {};

// Variables and initializations
// TODO: define candle 
strategy.init = function() {
  this.name = 'custom';
  this.currentTrend = 'long';
  this.requiredHistory = config.tradingAdvisor.historySize;

  // Define the indicators we need
  // Ex: this.addIndicator('name', 'type', parameters);

  this.addIndicator('dema', 'DEMA', settings);
  // diff, signal.result, short.result, long.result, result
 // this.addIndicator('cci', 'CCI', ccisettings);
  // short.result, long.result, macd, ppo, MACDsignal.result, PPOsignla.result
  // this.addIndicator('macd', 'MACD', macdsettings);
  // this.addIndicator('ppo', 'PPO', pposettings);
}

// Do something for new candle?
strategy.update = function(candle) {
  // Nothing
}

// Log information to display for debugging
// Ex: log.debug('thing to say', var);
strategy.log = function() {
}

// Check if we update based on new info
// candle.close = closing price for candle
// candle.high = highest price for candle
// candle.low = lowest price for candle
// candle.volume = trading volume for candle
// candle.trades = number of trades for candle
strategy.check = function(candle) {
  // buy when it hits buy price
  if(candle.close <= this.buyPrice) {
    this.advice("long");
    console.log("buying BTC @", candle.close);
    return;
  }
// sell when it hits sell price
if(candle.close >= this.sellPrice) {
    this.advice("short");
    console.log("selling BTC @", candle.close);
    console.log("Profit:", (candle.close-this.buyPrice));
    return;
  }
}

module.exports = strategy;