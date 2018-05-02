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

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {

  this.addTalibIndicator('stochrsi', 'stochrsi', this.settings.stochrsi);
  this.addTalibIndicator('macd', 'macd', this.settings.macd);
  this.addTalibIndicator('bbands', 'bbands', this.settings.bbands);
  this.requiredHistory = this.settings.requiredHistory;

  this.newTrend = {
    state: 'stale', // stale || bull || bear
    stochRsiK: null, // Stochastick RSI K
    stochRsiDiff: null, // Stochastick RSI K - D
    macd: null, // MACD
    histogram: null, // MACD - Signal
    low: null, // last candle low
    hight: null, // last candle hignt
    close: null, // last candle close
    upperBb: null, // middle Bollinger Band
    lowerBb: null, // middle Bollinger Band
    duration: 0, // duration of the trend
    stateStartPrice: 0, // price last time trend has changed
    change: 0 // change of price in % since trend has changed
  };
}

// What happens on every new candle?
strat.update = function(candle) {

  let macd = this.talibIndicators.macd;
  let stochrsi = this.talibIndicators.stochrsi;
  let bbands = this.talibIndicators.bbands;

  this.oldTrend = this.newTrend;
  this.newTrend = {
    stochRsiK: stochrsi.result.outFastK,
    stochRsiDiff: stochrsi.result.outFastK - stochrsi.result.outFastD,
    macd: macd.result.outMACD,
    signal: macd.result.outMACDSignal,
    histogram: macd.result.outMACDHist,
    close: candle.close,
    low: candle.low,
    high: candle.high,
    upperBb: bbands.result.outRealUpperBand,
    lowerBb: bbands.result.outRealLowerBand
  }
  updateState(this.newTrend, this.oldTrend);
  log.info('Trend update.\n', this.newTrend)
}

// Based on trend changes updates new trend state
updateState = function(newTrend, oldTrend) {

  if (stateConditions.startBull(newTrend, oldTrend) || stateConditions.contBull(newTrend, oldTrend)) {
    newTrend.state = 'bull';
  }
  else if (stateConditions.startBear(newTrend, oldTrend) || stateConditions.contBear(newTrend, oldTrend))  {
    newTrend.state = 'bear';
  }
  else if (oldTrend.state === 'bull' || oldTrend.state === 'bear') {
    newTrend.state = 'stale after ' + oldTrend.state;
  }
  else {
    newTrend.state = oldTrend.state;
  }

  if (newTrend.state === oldTrend.state) {
    newTrend.duration = oldTrend.duration + 1;
    newTrend.stateStartPrice = oldTrend.stateStartPrice;
  } else {
    newTrend.duration = 1;
    newTrend.stateStartPrice = newTrend.close;
  }

  newTrend.change = Math.trunc((100 * newTrend.close / newTrend.stateStartPrice) - 100);
}

const stateConditions = {
  // new trend
  startBull: function (newTrend) {
    return (newTrend.macd > 0 // overall bullish trend
      && newTrend.histogram > 0 // trend is bullish right now
      && newTrend.stochRsiDiff > 0 // there is persistent uptrend momentum
    )
  },
  startBear: function (newTrend) {
    return (newTrend.macd < 0 // overall bearish trend
      && newTrend.histogram < 0 // trend is bearish right now
      && newTrend.stochRsiDiff < 0 // there is persistent downtrend momentum
    )
  },
  // continuing trend
  contBull: function (newTrend, oldTrend) {
    return (
      oldTrend.state === 'bull'
      && newTrend.stochRsiDiff > 0
      && newTrend.histogram > 0
    )
  },
  contBear: function (newTrend, oldTrend) {
    return (
      oldTrend.state === 'bear'
      && newTrend.stochRsiDiff < 0
      && newTrend.histogram < 0
    )
  }
}

// For debugging purposes.
strat.log = function() {
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {

  let duration = this.newTrend.duration;
  let minDuration = this.settings.minTrendDuration;
  let oldChange = this.oldTrend.change;
  let change = this.newTrend.change;
  let state = this.newTrend.state;

  if (observedStates.start.includes(state)
    || duration === minDuration) {
    log.info('Advice about start');
    this.advice('telegram: ' + state + ' started');

  } else if (observedStates.grow.includes(state)
    && duration > minDuration
    && change > oldChange) {
    log.info('Advice about grow');
    this.advice('telegram: ' + state + ' ' + change + '%')
  }
}

const observedStates = {
  start: ['bull', 'bear', 'stale after bull', 'stale after bear'],
  grow: ['bull', 'stale after bear', 'stale after bull'],
  drop: ['bear', 'bearish stale']
}

module.exports = strat;
