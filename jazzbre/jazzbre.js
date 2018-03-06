// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var RSI = require('./indicators/RSI.js');
var MACD = require('./indicators/MACD.js');
var PPO = require('./indicators/PPO.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function () {
  this.name = 'DEMA';

  this.currentTrend;
  this.requiredHistory = 0; //this.tradingAdvisor.historySize;

  var scale = 2;
  // define the indicators we need
  this.addIndicator('dema', 'DEMA', this.settings);

  this.ema1Setting = 8;
  this.ema2Setting = 13;
  this.ema3Setting = 21;
  this.ema4Setting = 55;
  this.ema5Setting = 100;
  this.addIndicator('ema1', 'EMA', this.ema1Setting);
  this.addIndicator('ema2', 'EMA', this.ema2Setting);
  this.addIndicator('ema3', 'EMA', this.ema3Setting);
  this.addIndicator('ema4', 'EMA', this.ema4Setting);
  this.addIndicator('ppo', 'PPO', this.settings);
  //   this.addIndicator('ema5', 'EMA', this.ema5Setting);
  this.addIndicator('rsi', 'RSI', this.settings);
  this.settings.short = 12;
  this.settings.long = 26;
  this.settings.signal = 9;
  this.addIndicator('macd', 'MACD', this.settings);
  this.index = 0;
  this.lastSellIndex = 0;
  this.buy = false;
  this.stop = -1;
  this.price = -1;
  this.wasEmaBullish = false;
  this.wasEmaBearish = false;
  this.emaFlags = 0;
  this.previousCandleBullish = false;
  this.volumeAverage = 0;
  this.volumeCount = 0;
  this.ppoHigh = 0;
  this.previousEma1 = 0;
  this.previousEma2 = 0;
  this.previousEma3 = 0;
  this.previousEma4 = 0;
  this.previousClose = 0;
  this.rsiHistory = [];
  this.fiat = 100;
  this.crypto = 0;
}

function PredictEma(ema_f, ema_f_value, ema_s, ema_s_value, time = 1) {
  return (((-time + ema_f) * (time + ema_s) * ema_f_value) - ((time + ema_f) * (-time + ema_s) * ema_s_value)) / ((time * 2) * (ema_f - ema_s));
}

// what happens on every new candle?
method.update = function (candle) {
  /*
  var dema = this.indicators.dema;
  var diff = dema.result;
  var price = candle.close;

  var message = '@ ' + price.toFixed(8) + ' (' + diff.toFixed(5) + ')';

  if(diff > this.settings.thresholds.up) {
    log.debug('we are currently in uptrend', message);

    if(this.currentTrend !== 'up') {
      this.currentTrend = 'up';
      this.advice('long');
    } else
      this.advice();

  } else if(diff < this.settings.thresholds.down) {
    log.debug('we are currently in a downtrend', message);

    if(this.currentTrend !== 'down') {
      this.currentTrend = 'down';
      this.advice('short');
    } else
      this.advice();

  } else {
    log.debug('we are currently not in an up or down trend', message);
    this.advice();
  }
  */
  var ema1 = this.indicators.ema1.result;
  var ema2 = this.indicators.ema2.result;
  var ema3 = this.indicators.ema3.result;
  var ema4 = this.indicators.ema4.result;

  for (var i = 0; i < 10; ++i) {
    var a = 0;
  }
  //   var ema5 = this.indicators.ema5.result;
  var rsi = this.indicators.rsi.result;
  this.indicators.rsi.result = rsi;
  var macd = this.indicators.macd;
  var diff = macd.diff;
  var signal = macd.result;
  var macdShort = macd.short.result - macd.signal.result;
  var macdLong = macd.long.result - macd.signal.result;
  var ppoSignal = this.indicators.ppo.PPOsignal.result;
  var macdSignal = this.indicators.ppo.MACDsignal.result;
  this.indicators.ppo.result = ppoSignal;
  var percentSize = (candle.close / 100.0);

  this.rsiHistory.push(rsi);
  if (this.rsiHistory.length > 16) {
    this.rsiHistory.splice(0, 1);
  }

  var volume = this.volumeAverage;
  if (this.volumeCount == 0) {
    this.volumeCount++;
    this.volumeAverage = candle.volume;
    volume = this.volumeAverage;
  } else {
    this.volumeCount++;
    this.volumeAverage += candle.volume;
    volume = this.volumeAverage / this.volumeCount;
  }

  //   var emaBullish = candle.volume > volume * 3 && ema1 > ema2 && ema2 > ema3 && ema3 > ema4 /*&& (this.emaFlags & 2) != 0*//* && rsi < 50*/ && ppoSignal > 0.2 && signal > 0.0;// && candle.low > ema1 && candle.close > ema1 && (this.index - this.lastSellIndex) > 5;// && (this.emaFlags & 2) != 0;
  //   var emaBullish = ema1 > ema2 && ema2 > ema3 && ema3 > ema4;
  //   var emaBearish = ema1 < ema2 && ema2 < ema3 && ema3 < ema4;
  var emaBullish = ema1 > ema2;
  var emaBearish = ema1 < ema2;

  var emaCurVal = PredictEma(this.ema1Setting, ema1, this.ema4Setting, ema4);
  var emaPrevVal = PredictEma(this.ema1Setting, this.previousEma1, this.ema4Setting, this.previousEma4);

  /*
  if(ema1 < ema4 && emaCurVal <= candle.close && emaPrevVal > this.previousClose) {
    this.indicators.ema2.result = candle.close + percentSize * 10;
  } else if(ema1 > ema4 && emaCurVal >= candle.close && emaPrevVal < this.previousClose) {
    this.indicators.ema2.result = candle.close - percentSize * 10;
  } else {
    this.indicators.ema2.result = candle.close;
  }
  */
  /*
  if(ema1 < ema4 && emaCurVal <= candle.close && emaPrevVal > this.previousClose) {
    log.debug("EMA Crossover Up!");
    emaBullish = true;
  } else {
    emaBullish = false;
  }
  if(ema1 > ema4 && emaCurVal >= candle.close && emaPrevVal < this.previousClose) {
    log.debug("EMA Crossover Down!");
    emaBearish = true;
  } else {
    emaBearish = false;
  }
  /**/

  var adviced = false;

  if (emaBullish && !this.wasEmaBullish) {
    this.emaFlags |= 1;
  }
  if (emaBearish && !this.wasEmaBearish) {
    this.emaFlags |= 2;
  }

  rsiHighs = [];
  if (this.rsiHistory.length > 2) {
    var lastValue = this.rsiHistory[0];
    var direction = 0;
    for (var i = 1; i < this.rsiHistory.length; ++i) {
      var thisValue = this.rsiHistory[i];
      var newDirection = thisValue - lastValue;
      //       log.debug('rsi i:' + i + ' val:' + this.rsiHistory[i] + ' dir:' + newDirection);
      if (direction > 0 && newDirection < 0) {
        rsiHighs.push(lastValue);
        //         log.debug('RsiHigh:' + lastValue);
      }
      lastValue = thisValue;
      direction = newDirection;
    }
  }

  var rsiDirection = 0;

  if (rsiHighs.length > 0) {
    var high = -1;
    for (var i = 0; i < rsiHighs.length; ++i) {
      var h = rsiHighs[i];
      if (h > high) {
        high = h;
      }
    }
    if (high > 0) {
      rsiDirection = rsi - high;
    }
  }

  if (!this.buy) {
    if (!this.wasEmaBullish && emaBullish) { // && rsiDirection>2) {// && rsi < 80) {
      this.buy = true;
      this.advice('long');
      log.debug('Buy at:' + candle.close + ' rsiDirection:' + rsiDirection + ' time:' + candle.start.utc().format());
      this.stop = candle.close - percentSize * 2;
      this.price = candle.close;
      adviced = true;
      this.emaFlags &= ~2;
      this.ppoHigh = ppoSignal;
      this.crypto = this.fiat / (candle.close + candle.close * 0.0025);
    }
  } else {
    if (ppoSignal > this.ppoHigh) {
      this.ppoHigh = ppoSignal;
    }
    //     if((candle.close > this.price + percentSize * 20) || (this.stop != -1 && candle.close < this.stop) || ppoSignal < this.ppoHigh * 0.5) {
    //     if((rsi > 50 && (emaBearish || rsi > 80)) || (this.stop != -1 && candle.close < this.stop)) {//candle.close > this.price + percentSize * 10) {
    //     if(ppoSignal < this.ppoHigh * 0.5 || macd < 0 || (  /*rsi > 50 && */(emaBearish/* || rsi > 80*/)) || (this.stop != -1 && candle.close < this.stop)) {//candle.close > this.price + percentSize * 10) {
    //     if(ppoSignal < this.ppoHigh * 0.5) {
    if (emaBearish) { // || (this.stop != -1 && candle.close < this.stop)) {// || (this.stop != -1 && candle.close < this.stop) || candle.close < ema1) {
      this.buy = false;
      this.advice('short');
      this.fiat = this.crypto * candle.close;
      log.debug('Sell at:' + candle.close + ' time:' + candle.start.utc().format() + ' fiat:' + this.fiat);
      adviced = true;
      this.stop = -1;
      this.lastSellIndex = this.index;
      this.emaFlags &= ~1;
    }
  }
  if (!adviced) {
    this.advice();
  }
  //   log.debug('emaBullish:' + emaBullish + ' emaBearish:' + emaBearish + ' volume:' + candle.volume + ' rsi:' + rsi + ' signal:' + ppoSignal + ' avg_volume:' + volume + ' ppoHigh:' + this.ppoHigh);
  this.wasEmaBullish = emaBullish;
  this.wasEmaBearish = emaBearish;
  this.previousEma1 = ema1;
  this.previousEma2 = ema2;
  this.previousEma3 = ema3;
  this.previousEma4 = ema4;
  this.index++;
  this.previousCandleBullish = candle.open > ema1 && candle.close > ema1;
  this.previousClose = candle.close;
  log.debug('macdLong:' + macdLong + ' macdShort:' + macdShort + ' ,macdResult:');
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function () {}

method.check = function (candle) {}

method.end = function () {
  log.debug('end %:' + this.percentDiff);
}

module.exports = method;
