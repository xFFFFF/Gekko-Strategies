// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// 新模块
var method = {};

// 初始化
method.init = function() {
  // 策略名称
  this.name = 'DEMA';

  this.currentTrend;
  this.requiredHistory = this.tradingAdvisor.historySize;

  // 引用DEMA指标
  this.addIndicator('dema', 'DEMA', this.settings);
}

// 在新的蜡烛（迭代）出现时做什么？
method.update = function(candle) {
  // 啥也不做，这是模板，需要时可以加
}

// 向日志中打印每次迭代的内容
method.log = function() {
  var dema = this.indicators.dema;

  log.debug('calculated DEMA properties for candle:');
  log.debug('\t', 'long ema:', dema.long.result.toFixed(8));
  log.debug('\t', 'short ema:', dema.short.result.toFixed(8));
  log.debug('\t diff:', dema.result.toFixed(5));
  log.debug('\t DEMA age:', dema.short.age, 'candles');
}

method.check = function(candle) {
  // DEMA策略
  var dema = this.indicators.dema;
  // 当次迭代的结果，见上一个程序块中的说明。
  var diff = dema.result;
  // 这个周期的收盘价
  var price = candle.close;

  var message = '@ ' + price.toFixed(8) + ' (' + diff.toFixed(5) + ')';
  // 超过上限，触发卖出信号
  if(diff > this.settings.thresholds.up) {
    log.debug('we are currently in uptrend', message);
    // 如果触发时有仓位，则卖出
    if(this.currentTrend !== 'up') {
      this.currentTrend = 'up';
      this.advice('long');
    } else //否则啥也不做
      this.advice();
  } 
  // 低于下限，触发买入信号
  else if(diff < this.settings.thresholds.down) { 
    log.debug('we are currently in a downtrend', message);
    // 如果触发时没有仓位，则买入
    if(this.currentTrend !== 'down') {
      this.currentTrend = 'down';
      this.advice('short');
    } else //否则啥也不做
      this.advice();
  } 
  // 在上限与下限之间，啥也不做
  else {
    log.debug('we are currently not in an up or down trend', message);
    this.advice();
  }
}

module.exports = method;


