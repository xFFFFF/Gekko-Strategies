// helpers
const _ = require('lodash');
const log = require('../core/log.js');
const helper = require('../helper.js');

// NOTICE: SHORT POSITION DOES NOT WORK

// Let's create our own strategy 
const strategy = {};
const OPEN_FLONG = 'Open fast long';
const OPEN_FSHORT = 'Open fast short';
const CLOSE_FAST = 'Close fast long';
const OPEN_SLONG = 'Open slow long';
const OPEN_SSHORT = 'Open slow short';
const CLOSE_SLOW = 'Close slow long';

const makeAdviceLog = (type, price) => {
  log.debug(`${type} at ${price}`);
}

// Prepare everything our strategy needs
strategy.init = function() {
  log.debug('settings', this.settings);
  const { enter_fast, exit_fast, enter_slow, exit_slow, trailingStop } = this.settings;
  this.enterFast = enter_fast;
  this.exitFast = exit_fast;
  this.enterSlow = enter_slow;
  this.exitSlow = exit_slow;
  this.requiredHistory = this.enterFast;
  this.stopLoss = helper.trailingStopLoss();
  this.stopLoss.percentage = trailingStop;
  
  this.candles = [];
  this.tradeType = null
  this.count = 0;
}

// What happens on every new candle?
strategy.update = function(candle) {
  this.candles.push(candle);

  this.toUpdate = false;

  // Check if this is the highest in `this.enterFast` candles
  if (this.candles.length > this.enterFast) {
    const listFast = _.last(this.candles, this.enterFast);
    const breakOutHight = _.max(listFast, 'close');
    const breakOutLow = _.min(listFast, 'close');

    if (breakOutHight.close === candle.close) {
      this.toUpdate = true;
      candle.status = OPEN_FLONG;
      this.tradeType = OPEN_FLONG;
    }

    // if (breakOutLow.close === candle.close) {
    //   this.toUpdate = true;
    //   candle.status = OPEN_FSHORT;
    //   this.tradeType = OPEN_FSHORT;
    // }
  }

  // Close fast to get profit
  if (this.candles.length > this.exitFast) {
    const listFast = _.last(this.candles, this.exitFast);
    const breakOutHight = _.max(listFast, 'close');
    const breakOutLow = _.min(listFast, 'close');

    if (breakOutLow.close === candle.close) {
      this.toUpdate = true;
      candle.status = CLOSE_FAST;
      this.tradeType = CLOSE_FAST;
    }
  }

  if (this.candles.length > this.enterSlow) {
    const listLong = _.last(this.candles, this.enterSlow);
    const breakOutHight = _.max(listLong, 'close');
    const breakOutLow = _.min(listLong, 'close');

    if (breakOutHight.close === candle.close) {
      this.toUpdate = true;
      candle.status = OPEN_SLONG;
      this.tradeType = OPEN_SLONG;
    }

    // if (breakOutLow.close === candle.close) {
    //   this.toUpdate = true;
    //   candle.status = OPEN_SSHORT;
    //   this.tradeType = OPEN_SSHORT;
    // }
  }

  // Close slow
  if (this.candles.length > this.exitSlow) {
    const listSlow = _.last(this.candles, this.exitSlow);
    const breakOutHight = _.max(listSlow, 'close');
    const breakOutLow = _.min(listSlow, 'close');

    if (breakOutLow.close === candle.close) {
      this.toUpdate = true;
      candle.status = CLOSE_SLOW;
      this.tradeType = CLOSE_SLOW;
    }
  }
}

// For debugging purposes.
strategy.log = function() {
  
}

// Based on the newly calculated
// information, check if we should
// update or not.
strategy.check = function(candle) {

  const currentPrice = candle.close;
  this.stopLoss.log(); // Log StopLoss
	if (this.stopLoss.isTriggered(currentPrice)) {
    log.debug('Stop loss triggered');
		this.advice('short');
    this.stopLoss.destroy();
	} else {
    this.stopLoss.update(currentPrice);
  }

  if (!this.toUpdate) {
    log.debug('NO TRADING!!!');
    return;
  }
  
  makeAdviceLog(this.tradeType, currentPrice);

  if (this.tradeType === OPEN_FLONG) {
    this.advice('long');
    this.stopLoss.create(this.stopLoss.percentage, candle.close);
  }
  if (this.tradeType === CLOSE_FAST) {
    this.advice('short');
    this.stopLoss.destroy();
  }
  if (this.tradeType === OPEN_SLONG) {
    this.advice('long');
    this.stopLoss.create(this.stopLoss.percentage, candle.close);
  }
  if (this.tradeType === CLOSE_SLOW) {
    this.advice('short');
    this.stopLoss.destroy();
  }
}

// Optional for executing code
// after completion of a backtest.
// This block will not execute in
// live use as a live gekko is
// never ending.
strategy.end = function() {
  
}

module.exports = strategy;