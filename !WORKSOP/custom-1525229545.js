// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

var log = require('../core/log');
var config = require('../core/util').getConfig();
var queue = require('../queue');

var timeRange = 1;
var has = false;
var cb;
var strat = {};
var sum = 0;
strat.init = function () {
  queue.setMaxLen(timeRange)
}

strat.update = function (candle) {
  queue.push(candle);
}

strat.log = function () {
  log.debug("sum:" + sum)
}


strat.check = function () {
  //买入信号

  if (has && queue.getTail().high - cb.high > 100) {
    //止盈
    this.advice('short');
    log.debug("止盈：" + queue.getTail().high + "-" + cb.high + "=" + (queue.getTail().close - cb.high))
    sum = sum + (queue.getTail().high - cb.high);
    has = false;
    return
  }
  if (has && queue.getTail().high - cb.high < -150) {
    //止损
    this.advice('short');
    log.debug("止损：" + queue.getTail().high + "-" + cb.high + "=" + (queue.getTail().high - cb.high))
    sum = sum + (queue.getTail().high - cb.high);
    has = false;
    return
  }

  //下跌趋势结束
  // var range = strat.getRange(queue.getAll());
  // if (!has && range.max.open - range.min.close > 150 && (queue.getTail().open - queue.getTail().close > 3) && !range.grow) {
  log.debug(queue.getTail().close + "-" + queue.getTail().open+"="+(queue.getTail().close - queue.getTail().open))
  if (!has && queue.getTail().close - queue.getTail().open > 70) {
    this.advice('long');
    log.debug("购买：" + queue.getTail().high)
    cb = queue.getTail();
    has = true;
    return;
  }
}

//判断价格区间
strat.getRange = function (arr) {
  var max, min;
  for (var c in arr) {
    var candle = arr[c];
    if (!max) {
      max = candle;
      min = candle;
    } else if (strat.getUp(candle) > strat.getUp(max)) {
      max = candle;
    } else if (strat.getDown(candle) > strat.getDown(min)) {
      min = candle;
    }
  }
  return {max: max, min: min, grow: max.start > min.start};
}

strat.getUp = function (candle) {
  return candle.open > candle.close ? candle.open : candle.close;
}
strat.getDown = function (candle) {
  return candle.open < candle.close ? candle.open : candle.close;
}

module.exports = strat;
