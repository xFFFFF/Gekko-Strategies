// skeleton example of strategy that operates on multiple timeframes
//
// this is not intended to be an example of a clever or profitable trading strategy!
//
// zappra  28/03/18

var log = require('../core/log');
var util = require('../core/util.js');
var config = util.getConfig();

const CandleBatcher = require('../core/candleBatcher');
var MACD = require('../strategies/indicators/MACD.js');

/////////////////////////////////////////////////////////////////////
var strat = {};

/////////////////////////////////////////////////////////////////////
strat.init = function() {

  log.debug('Initialising multi timeframe strategy');
  log.debug('stopBuffer=' + this.settings.stopBuffer + ' profitRatio=' + this.settings.profitRatio);

  // since we're relying on batching 1 minute candles into 15 and 30 minute candles
  // lets throw if the settings are wrong
  if (config.tradingAdvisor.candleSize !== 1) {
    throw "This strategy must run with candleSize=1";
  }

  // create candle batchers for 15 and 30 minute candles
  // 15 x 1 minute candle
  this.batcher15 = new CandleBatcher(15);
  // 2 x 15 minute candle
  this.batcher30 = new CandleBatcher(2);

  // supply callbacks for 15 and 30 minute candle functions
  this.batcher15.on('candle', this.update15);
  this.batcher30.on('candle', this.update30);

  // indicators
  var macdParams = {
    long: 26,
    short: 12,
    signal: 9,
  };

  // gekko will be running on 1 minute timeline internally
  // so we create and maintain indicators manually in order to update them at correct time
  // rather than using this.addIndicator
  this.macd15 = new MACD(macdParams);
  this.lastResult15 = -1;
  this.macd30 = new MACD(macdParams);
  this.lastResult30 = -1;

  // set some initial state
  this.hodling = false;
}

/////////////////////////////////////////////////////////////////////
strat.update = function(candle) {
  // reset the buy/sell flags before updating
  this.shouldBuy = false;
  this.shouldSell = false;

  // do 1 minute processing
  this.lastPrice = candle.close;

  // update stop and take profit, if applicable
  if (this.hodling) { 
      if (candle.close < this.stop) {
        log.debug('Stop loss triggered - stop loss is ' + this.stop + ', last closing price was ' + candle.close);
        this.shouldSell = true;
      }
      else if (candle.close > this.takeProfit) {
        log.debug('Taking profit!');
        this.shouldSell = true;
      }
  }

  // write 1 minute candle to 15 minute batcher
  this.batcher15.write([candle]);

}

/////////////////////////////////////////////////////////////////////
strat.update15 = function(candle) {
  // do 15 minute processing
  this.macd15.update(candle.close);

  // we sell on bearish crossover of high divergence threshold on 15 minute MACD
  // in the unlikely event that stop loss/take profit didn't trigger
  var result = this.macd15.result;
  var cross = this.settings.highCross;
  if (this.lastResult15 != -1 && this.hodling && result < cross && this.lastResult15 >= cross) {
      log.debug('Bearish crossover detected on 15 minute MACD');
      this.shouldSell = true;
  }
  this.lastResult15 = result;
  
  // write 15 minute candle to 30 minute batcher
  this.batcher30.write([candle]);
}

/////////////////////////////////////////////////////////////////////
strat.update30 = function(candle) {
  // do 30 minute processing
  this.macd30.update(candle.close);

  // we buy on bullish crossover of low divergence threshold on 30 minute MACD
  var result = this.macd30.result;
  var cross = this.settings.lowCross;
  if (this.lastResult30 != -1 && !this.hodling && result >= cross && this.lastResult30 < cross) {
      log.debug('Bullish crossover detected on 30 minute MACD');
      this.shouldBuy = true;
  }
  this.lastResult30 = result;
}

//////////////////////////////////////////////////////////////////////
strat.check = function() {

    // check for flags set in update functions, and buy/sell accordingly
    if (!this.hodling && this.shouldBuy) {
        // buy!
        log.debug('Buying at ' + this.lastPrice);
        this.advice('long');
        this.hodling = true;
        // setup stop loss and take profit prices
        var stopDistance = this.lastPrice * this.settings.stopBuffer;
        this.stop = this.lastPrice - stopDistance;
        this.takeProfit = this.lastPrice + stopDistance * this.settings.profitRatio;
        log.debug('Setting stop=' + this.stop + ' and takeProfit=' + this.takeProfit);
    }
    else if (this.hodling && this.shouldSell) {
        // sell!
        log.debug('Selling at ' + this.lastPrice);
        this.advice('short');
        this.hodling = false;
    }
}

module.exports = strat;
