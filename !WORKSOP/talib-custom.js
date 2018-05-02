// If you want to use your own trading methods you can
// write them here. For more information on everything you
// can use please refer to this document:
//
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md

var moment = require('moment');

var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config['talib-custom'];

// Let's create our own method
var method = {};

// Prepare everything our method needs
method.init = function() {
  this.name = 'talib-custom'
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = 'short';
  this.count = 0;

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = config.tradingAdvisor.historySize;

  var bbandsTalibSettings = settings.bbandsParameters;

  // define the indicators we need
  this.addTalibIndicator('mybbands', 'bbands', bbandsTalibSettings);

  // list displayed output (use the same name as config)
  this.advice.params = {
    upperBand: 0,
    middleBand: 0,
    lowerBand: 0,
    settlePrice: 0,
    maxPrice: 0,

    action: 0
    // indicator: 0,
    // indicator2: 0
  };
}

// What happens on every new candle?
method.update = function(candle) {
  var result = this.talibIndicators.mybbands.result;

  this.advice.params.upperBand = parseFloat(result.outRealUpperBand);
  this.advice.params.middleBand = parseFloat(result.outRealMiddleBand);
  this.advice.params.lowerBand = parseFloat(result.outRealLowerBand);

  if (this.trend === 'long') {
    this.advice.params.maxPrice = this.lastPrice > this.advice.params.maxPrice ? this.lastPrice : this.advice.params.maxPrice;
  }

  // this.advice.params.indicator = this.advice.params.upperBand * (1+settings.thresholds.up);
  // this.advice.params.indicator2 = this.advice.params.upperBand * (1+settings.thresholds.down);

  if (this.trend === 'short') {
    if (this.lastPrice > this.advice.params.upperBand * (1+settings.thresholds.up)) {
      this.count++;
    }
    if (this.lastPrice < this.advice.params.upperBand * (1+settings.thresholds.up)) {
      this.count = 0;
    }
  }
}


method.log = function() {
  // var digits = 8;
  //
  // log.debug('calculated Talib Bbands properties for candle:');
  // log.debug('\t', 'Time:', this.advice.time.format('YYYY-MM-DD HH:mm'));
  // log.debug('\t', 'UpperBands:', this.advice.params.upperBand.toFixed(digits));
  // log.debug('\t', 'MiddleBands:', this.advice.params.middleBand.toFixed(digits));
  // log.debug('\t', 'LowerBands:', this.advice.params.lowerBand.toFixed(digits));
  // log.debug('\t', 'MaxPrice:', this.advice.params.maxPrice.toFixed(digits));
  // log.debug('\t', 'LastPrice:', this.lastPrice.toFixed(digits));
  // log.debug('\t', 'trend:', this.trend);

  // if( this.advice.time > moment('2016-11-24 20:00'))
  //   stop
}

// Based on the newly calculated
// information, check if we should
// update or not.
method.check = function() {

  // buy
  if (this.trend !== 'long' && (
    (this.advice.params.upperBand - this.advice.params.middleBand) / this.advice.params.middleBand  > settings.thresholds.bandDev
    && this.lastPrice > this.advice.params.upperBand * (1+settings.thresholds.up)
    && this.count > settings.thresholds.count
  )) {

    if (this.lastPrice > this.advice.params.upperBand * (1+settings.thresholds.up))
      console.log("up band");
    if (this.count > settings.thresholds.count)
      console.log("count = " + settings.thresholds.count);

    console.log("devBand = " + (this.advice.params.upperBand - this.advice.params.middleBand) / this.advice.params.middleBand);

    this.advice.params.maxPrice = this.lastPrice;
    this.advice.params.settlePrice = this.lastPrice;

    this.advice.params.action = this.lastPrice*1.1;

    this.trend = 'long';
    this.advice('long');
    return;
  }

  // sell
  if (this.trend !== 'short' && (
    this.lastPrice < this.advice.params.maxPrice*(1+settings.thresholds.downMax)
    || this.lastPrice < this.advice.params.middleBand*(1+settings.thresholds.downMid)
    || this.lastPrice < this.advice.params.settlePrice*(1+settings.thresholds.downSet)
  )) {

    if(this.lastPrice < this.advice.params.maxPrice*(1+settings.thresholds.downMax))
      console.log("maxPrice: "+ this.advice.params.maxPrice*(1+settings.thresholds.downMax));
    if(this.lastPrice < this.advice.params.middleBand*(1+settings.thresholds.downMid))
      console.log("midBand "+ this.advice.params.middleBand*(1+settings.thresholds.downMid));
    if(this.lastPrice < this.advice.params.settlePrice*(1+settings.thresholds.downSet))
      console.log("settlePrice "+ this.advice.params.settlePrice*(1+settings.thresholds.downSet));

    this.count = 0;

    this.advice.params.settlePrice = this.lastPrice;

    this.advice.params.action = this.lastPrice*0.9;

    this.trend = 'short';
    this.advice('short');
    return;
  }
}

module.exports = method;
