var fs = require('fs-extra');
var log = require('../core/log');
var method = {};
var path = require('path');
var simple_moving_averager = require('./indicators/Benny-SMA');
var chalk = require('chalk');

var configFile = path.join('..', process.env.GEKKO_CONFIG || 'config.js');
var config = require(configFile);

method.init = function () {
  this.name = 'Benny';

  this.currencyPair = `${config.watch.asset}_${config.watch.currency}`;

  this.config = {
    short: Number(this.settings.short, 10),
    medium: Number(this.settings.medium, 10),
    minProfit: Number(this.settings.minProfit),
    quitBelow: Number(this.settings.quitBelow, 10),
  };

  this.short = simple_moving_averager(this.config.short);
  this.long = simple_moving_averager(this.config.medium);

  this.shortValue = 0;
  this.longValue = 0;

  this.cache = this.writeUpdates({version: 1});

  //log.info(`Trading ${config.watch.asset}/${config.watch.currency}`);
  //log.info(`https://www.binance.com/tradeDetail.html?symbol=${this.currencyPair}`);
  //log.info(`Latest values: ${JSON.stringify(this.cache)}`);
};

//{"version":1,"lastAction":"sell","lastBuyPrice":54490,"lastSellPrice":54132}
method.writeUpdates = function (updates) {
  let name = path.join(__dirname, 'cache', `${this.currencyPair}.json`);
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
};

method.update = function (candle) {
  const time = candle.start.format("YYYY-MM-DD HH:mm:ss");
  const price = Number(candle.close).toFixed(8);

  this.shortValue = this.short(candle.close);
  this.longValue = this.long(candle.close);

  let message = `Price: ${price} (${time})`;
  /*
  log.info(message);
  // Log triggers
  // TODO: Split in "buy" and "sell" triggers
  log.info(this.printPriceTrigger(this.cache.lastBuyPrice, candle.close));
  log.info(this.printProfitTrigger(this.cache.lastBuyPrice, candle.close));
  log.info(this.printMovingAverageTrigger(this.shortValue, this.longValue));
  */
};

method.printPriceTrigger = function (lastBuyPrice = 0, lastPrice = 0) {
  const text = 'Current price above last buy';
  const conditionalText = (lastPrice > lastBuyPrice) ? chalk`{green ${text}}` : chalk`{red ${text}}`;
  const relation = (lastPrice > lastBuyPrice) ? `>` : `<=`;
  const humanLastBuy = lastBuyPrice.toFixed(8);
  const humanCurrent = lastPrice.toFixed(8);
  return `${conditionalText} (${humanCurrent} ${relation} ${humanLastBuy})`;
};

method.printProfitTrigger = function (lastBuyPrice = 0, lastPrice = 0) {
  const percentage = this.getPercentage(lastBuyPrice, lastPrice);
  const text = 'Profit goal reached';
  const conditionalText = (percentage > this.config.minProfit) ? chalk`{green ${text}}` : chalk`{red ${text}}`;
  const humanProfit = percentage.toFixed(8);
  const humanTargetProfit = this.config.minProfit.toFixed(2);
  const relation = (percentage > this.config.minProfit) ? `>` : `<=`;
  return `${conditionalText} (${humanProfit}% ${relation} ${humanTargetProfit}%)`;
};

method.printMovingAverageTrigger = function (shortValue = 0, longValue = 0) {
  const humanShort = shortValue.toFixed(8);
  const humanLong = longValue.toFixed(8);

  const relation = (shortValue > longValue) ? `>` : `<=`;

  const text = 'Short above long';
  const conditionalText = (this.shortValue > this.longValue) ? chalk`{green ${text}}` : chalk`{red ${text}}`;

  return `${conditionalText} (${humanShort} ${relation} ${humanLong})`;
};

method.saveBuy = function (price) {
  this.cache = this.writeUpdates({
    lastAction: 'buy',
    lastBuyPrice: price
  });
};

method.saveSell = function (price) {
  this.cache = this.writeUpdates({
    lastAction: 'sell',
    lastSellPrice: price
  });
};

method.buy = function (candle, initial = false) {
  const time = candle.start.format("YYYY-MM-DD HH:mm:ss");
  const price = Number(candle.close).toFixed(8);

  log.info(`Buying at: ${price} (${time})`);
  this.advice("long");
  this.saveBuy(candle.close);
};

method.getPercentage = function (start, end) {
  const W = end - start;
  return Number((W * 100) / end);
};

method.sell = function (candle, initial = false) {
  const time = candle.start.format("YYYY-MM-DD HH:mm:ss");
  const price = Number(candle.close).toFixed(8);

  const percentage = this.getPercentage(this.cache.lastBuyPrice, candle.close);

  const isHigher = (candle.close > this.cache.lastBuyPrice);
  const isProfitable = (percentage > this.config.minProfit);

  if (isHigher && isProfitable) {
    log.info(`Selling at: ${price} (${time}) (+${percentage.toFixed(2)})`);
    this.advice("short");
    this.saveSell(candle.close);
  }

  //WK
  log.info(`Checking: ${this.cache.lastBuyPrice} ${candle.close} ${percentage.toFixed(2)}% (${this.config.quitBelow})`);
  if (percentage < this.config.quitBelow) {
    log.info('We are running far beyond... Quitting trading activities.')
    this.saveSell(candle.close);
    return this.advice("short");
  }
  //end WK
};

method.check = function (candle) {
  const isUpTrend = (this.shortValue > this.longValue);
  const isDownTrend = (this.shortValue < this.longValue);
  // if (candle.close < this.config.quitBelow) {
  //   log.info('We are running far beyond... Quitting trading activities.')
  //   return this.sell(candle, true);
  // }
  if (isUpTrend) {
    if (this.cache.lastAction === 'sell') this.buy(candle);
    if (!this.cache.lastAction) this.buy(candle, true);
  } else if (isDownTrend) {
    if (this.cache.lastAction === 'buy') this.sell(candle);
    if (!this.cache.lastAction) this.sell(candle, true);
  }
};

module.exports = method;
