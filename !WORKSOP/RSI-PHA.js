/*

  RSI - cykedev 14/02/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var RSI = require('./indicators/RSI.js');
var SMA = require('./indicators/MACD.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'RSI-PHA';
  this.downCount = 0;

  this.lastCandle;
  this.currentCandle;
  this.tradeCount = 0;

  this.lastEMA = 0;
  this.currentEMA = 0;
  this.maxMACDShortAfterUp = 0;
  this.macdDownCrossedAfterBuy = false;
  this.maxRSIAfterMACDUp = 0;

  this.macdVals = [];
  this.rsis = [];

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false,
    buy: 0,
    sell: 0,
    action: false,
  };

  this.macdTrend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false,
    sellOnHigh: false,
  };
  this.dmaTrend = '';

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', { interval: 14 });
  log.debug('This settings: ', this.settings);
  // this.addIndicator('sma', 'SMA', 9);
  // this.addIndicator('dema', 'DEMA', this.settings.dma);
  this.addIndicator('macd', 'MACD', this.settings.macd);
};

method.getCandleHeight = function(candle) {
  return candle.close - candle.open;
};

method.IsAtTooHigh = function(lastCandle, currentCandle) {
  if (
    this.getCandleHeight(currentCandle) > 0 &&
    this.getCandleHeight(currentCandle) > 0.05 * currentCandle.close
  ) {
    return true;
  }
  return false;
};

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  var digits = 8;
  var rsi = this.indicators.rsi;
  // log.debug(
  //   '\t',
  //   'rsi:',
  //   rsi.result.toFixed(digits),
  //   this.trend.duration,
  //   this.settings.thresholds.persistence
  // );
  if (
    rsi.result < this.settings.thresholds.low &&
    this.trend.duration >= this.settings.thresholds.persistence
  ) {
    // log.debug('calculated RSI properties for candle:');
    // log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
    // log.debug('\t', 'price:', candle.close.toFixed(digits));
    // log.debug('\t', 'buy:', this.trend.buy);
    // log.debug('\t', 'time:', candle.start);
  }
};

method.runMACD = function(candle) {
  return this.buyOnMACDCross(candle);
};

method.buyOnMACDCross = function(candle) {
  var macddiff = this.indicators.macd.result;
  var rsiVal = this.indicators.rsi.result;

  // log.debug('Running MACD: ', macddiff, ' - Time: ', candle.start);

  if (macddiff > this.settings.macd.up) {
    // new trend detected
    if (this.macdTrend.direction !== 'up') {
      // reset the state for the new trend
      this.macdTrend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false,
      };
      this.macdTrend.sellOnHigh = false;
      this.maxMACDShortAfterUp = this.indicators.macd.diff;
      this.macdVals = [];
      this.macdVals.push(this.maxMACDShortAfterUp);
      this.maxRSIAfterMACDUp = this.indicators.rsi.result;
      this.rsis = [];
      this.rsis.push(this.maxRSIAfterMACDUp);
    }

    this.macdTrend.duration++;

    if (this.macdTrend.duration >= this.settings.macd.persistence) {
      this.macdTrend.persisted = true;
    }

    log.debug(
      '**** MACD on High',
      this.macdTrend.duration,
      'candle(s):',
      candle.close,
      '- Time: ',
      candle.start,
      '- Open <= CLose: ',
      candle.open <= candle.close,
      '- Persited: ',
      this.macdTrend.persisted,
      '- Adviced: ',
      this.macdTrend.adviced,
      '- Increase EMA: ',
      this.maxMACDShortAfterUp - this.indicators.macd.diff,
      '- MACD signsl: ',
      this.indicators.macd.signal.result
    );
    // log.debug('- RSI Vals: ', this.rsis);
    if (
      this.trend.buy == 0 &&
      this.macdTrend.persisted &&
      !this.macdTrend.adviced &&
      rsiVal < this.settings.macd.rsi &&
      this.macdTrend.duration < 8 &&
      candle.close >= candle.open &&
      !this.IsAtTooHigh(this.lastCandle, this.currentCandle) &&
      this.maxMACDShortAfterUp == this.indicators.macd.diff &&
      // this.maxRSIAfterMACDUp == this.indicators.rsi.result &&
      !this.macdTrend.sellOnHigh &&
      this.indicators.macd.signal.result < this.settings.macd.signalhigh
    ) {
      log.debug(
        '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<Buy on MACD cross',
        this.macdTrend.duration,
        'candle(s):',
        candle.close,
        '- Time: ',
        candle.start,
        '- MACD signsl: ',
        this.indicators.macd.signal.result
      );
      // log.debug('- MACD Vals: ', this.macdVals);
      // log.debug('- RSI Vals: ', this.rsis);
      this.doBuy(candle.close);
      return true;
    }
  } else if (macddiff < this.settings.macd.down) {
    // new trend detected
    // Update trend but do nothing
    if (this.macdTrend.direction !== 'down') {
      // reset the state for the new trend
      this.macdTrend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false,
      };
      // log.debug(
      //   '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<On MACD down',
      //   this.macdTrend.duration,
      //   'candle(s):',
      //   candle.close,
      //   '- Time: ',
      //   candle.start
      // );

      if (this.trend.buy > 0) {
        this.macdDownCrossedAfterBuy = true;
      }
    }

    this.macdTrend.duration++;
    if (this.macdTrend.duration >= 1) this.macdTrend.persisted = true;

    if (
      this.trend.buy > 0 &&
      this.macdTrend.persisted &&
      !this.macdTrend.adviced &&
      this.macdDownCrossedAfterBuy
    ) {
      log.debug(
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Sell on MACD cross',
        this.macdTrend.duration,
        'candle(s):',
        candle.close,
        '- Time: ',
        candle.start
      );
      // this.macdDownCrossedAfterBuy = false;

      this.doSell(candle.close);
      return true;
    }
  }
  return false;
};

method.buyOnSAMCross = function(candle) {
  var dema = this.indicators.dema;
  var diff = dema.result;
  var price = candle.close;
  var message = '@ ' + price.toFixed(8) + ' (' + diff.toFixed(5) + ')';
  if (diff > this.settings.dma.up && this.trend.buy == 0) {
    if (this.dmaTrend !== 'up') {
      log.debug(
        '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<Buy on cross',
        message
      );
      this.dmaTrend = 'up';
      this.doBuy(price);
      return true;
    }
  }
  // else if (diff < this.settings.dma.down) {
  //   log.debug('we are currently in a downtrend', message);

  //   if (this.dmaTrend !== 'down') {
  //     this.dmaTrend = 'down';
  //     this.doSell(price);
  //     return true;
  //   }
  // }
  return false;
};

method.update = function(candle) {
  this.lastCandle = this.currentCandle;
  this.currentCandle = candle;
  this.lastEMA = this.currentEMA;
  this.currentEMA = this.indicators.macd.diff;
  this.updateMaxMACDAfterUp(candle);
  this.updateMaxRSI(candle);
  this.downCount = candle.close < candle.open ? this.downCount + 1 : 0;
};

method.updateMaxMACDAfterUp = function(candle) {
  this.maxMACDShortAfterUp =
    this.currentEMA > this.maxMACDShortAfterUp
      ? this.currentEMA
      : this.maxMACDShortAfterUp;
  this.macdVals.push(this.currentEMA);
};

method.updateMaxRSI = function(candle) {
  this.maxRSIAfterMACDUp =
    this.indicators.rsi.result > this.maxRSIAfterMACDUp
      ? this.indicators.rsi.result
      : this.maxRSIAfterMACDUp;
  this.rsis.push(this.indicators.rsi.result);
};

method.updateRSITrend = function(direction) {
  // new trend detected
  if (this.trend.direction !== direction) {
    log.debug('Reset trend', this.trend.direction, direction);
    this.trend = {
      duration: 0,
      persisted: false,
      direction: direction,
      adviced: false,
      buy: this.trend.buy,
      sell: this.trend.sell,
    };
  }
  this.trend.duration++;
};

/**
 * Return true if there is any buy or sell action
 * @param {*} rsiVal
 * @param {*} candle
 */
method.runRSI = function(rsiVal, candle) {
  if (rsiVal <= 0) {
    log.debug('Not enought data for rsi');
    return false;
  }
  if (this.checkSellOnHighRSI(rsiVal, candle)) {
    return true;
  } else {
    return this.checkBuyOnLowRSI(rsiVal, candle);
  }
};

method.checkSellOnHighRSI = function(rsiVal, candle) {
  if (rsiVal > this.settings.thresholds.high) {
    // new trend detected
    this.updateRSITrend('high');
    // log.debug(
    //   'In high since: - Duration: ',
    //   this.trend.duration,
    //   '- Buy: ',
    //   this.trend.buy,
    //   ' - Adviced: ',
    //   this.trend.adviced,
    //   '- Time: ',
    //   candle.start
    // );
    if (
      this.trend.duration >= this.settings.thresholds.highpersistence &&
      candle.low > this.trend.buy
    ) {
      this.trend.persisted = true;
    }

    if (this.trend.buy > 0 && this.trend.persisted && !this.trend.adviced) {
      log.debug(
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>SELL:  In high since',
        this.trend.duration,
        'candle(s):',
        candle.close,
        '- RSI: ',
        rsiVal,
        '- Time: ',
        candle.start
      );

      this.doSell(candle.close);
    } else {
      this.doNothing();
    }
    return true;
  }
  return false;
};

method.checkBuyOnLowRSI = function(rsiVal, candle) {
  if (rsiVal < this.settings.thresholds.low) {
    // new trend detected
    this.updateRSITrend('low');

    if (this.trend.duration >= this.settings.thresholds.persistence) {
      this.trend.persisted = true;
    }

    // log.debug(
    //   'Checking to buy:',
    //   this.trend.buy,
    //   this.trend.persisted,
    //   this.trend.adviced,
    //   this.trend.duration
    // );
    if (this.trend.persisted && !this.trend.adviced && this.trend.buy == 0) {
      log.debug(
        '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<BUY: In low since',
        this.trend.duration,
        'candle(s):',
        candle.close,
        '- RSI: ',
        rsiVal,
        '- Time: ',
        candle.start
      );
      this.doBuy(candle.close);
    } else {
      this.doNothing();
    }
    return true;
  }
  return false;
};

method.checkTakeProfit = function(rsiVal, candle) {
  if (
    rsiVal >= this.settings.minrsiprofit &&
    this.trend.buy > 0 &&
    candle.close >= this.trend.buy * (1 + this.settings.microprofit / 100)
  ) {
    log.debug(
      '***********************************SELL: Got target trend: ',
      100 * (candle.close - this.trend.buy) / this.trend.buy
    );
    this.doSell(candle.close);
    return true;
  }
  return false;
};

method.checkStopLost = function(rsiVal, candle) {
  if (rsiVal >= this.settings.checklost && this.trend.buy > candle.high) {
    log.debug(
      '***********************************SELL: Stop lost due to hight rsi but low price: ',
      candle.close,
      '- RSI: ',
      rsiVal,
      '- Time: ',
      candle.start
    );
    this.doSell(candle.close);
    return true;
  }
  var maxLost = this.trend.buy * this.settings.maxloss / 100;
  if (candle.low <= this.trend.buy - maxLost) {
    log.debug(
      '***********************************SELL: Stop loss due to low price: ',
      candle.close,
      '- Time: ',
      candle.start,
      '- Loss: ',
      100 * (this.trend.buy - candle.low) / this.trend.buy,
      '%'
    );
    this.doSell(candle.close);
    return true;
  }
  // if (
  //   this.trend.buy > 0 &&
  //   rsiVal > this.settings.thresholds.low &&
  //   this.downCount == 2
  // ) {
  //   log.debug(
  //     '***********************************SELL: Stop loss due 2 down candles: ',
  //     candle.close,
  //     '- Time: ',
  //     candle.start
  //   );
  //   this.doSell(candle.close);
  //   return true;
  // }
  return false;
};

method.doBuy = function(price) {
  // log.debug('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<buy');
  this.macdDownCrossedAfterBuy = false;
  this.trend.adviced = true;
  this.trend.action = true;
  this.advice('long');
  this.trend.buy = price;
  this.trend.sell = 0;
};

method.doSell = function(price) {
  // log.debug('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Sell');
  if (this.indicators.macd.result > this.settings.macd.up) {
    this.macdTrend.sellOnHigh = true;
  }
  this.macdDownCrossedAfterBuy = false;
  this.trend.adviced = true;
  this.trend.action = true;
  this.advice('short');
  this.trend.sell = price;
  this.trend.buy = 0;
  this.tradeCount++;
  log.debug(
    '>>>>>>>>>>>>>>>>>>>> Trade: ',
    this.tradeCount,
    '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
  );
};

method.doNothing = function() {
  this.advice();
  this.trend.action = false;
};

method.check = function(candle) {
  var rsiVal = this.indicators.rsi.result;
  var done = false;

  // if (rsiVal <= 0) {
  //   log.debug('Not enought data for rsi');
  //   this.doNothing();
  //   return;
  // }
  // Check RSI first
  done = this.runRSI(rsiVal, candle);
  // Check MACD
  if (!done) {
    done = this.runMACD(candle);
  }
  // Check take profit when no action has been done
  if (!done) {
    done = this.checkTakeProfit(rsiVal, candle);
  }
  // Check stoploss when no action has been done
  if (!done) {
    done = this.checkStopLost(rsiVal, candle);
  }
  // If no action done, we advice do nothing
  if (!done) {
    this.doNothing();
  }
};

module.exports = method;
