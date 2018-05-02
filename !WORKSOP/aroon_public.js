// If you want to use your own trading methods you can
// write them here. For more information on everything you
// can use please refer to this document:
//
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md
//
// This strategie is custom made for the Gekko Community
// Check out aroon indicator https://tulipindicators.org/aroon
//
// Steven Hop (Shop) 13-february-2018

// These utilities helpt me.
// helper.js can be found on https://github.com/cloggy45/Gekko-Bot-Resources/tree/master/gekko
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();
var helper = require('../helper.js');
// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function(candle) {
  this.name = 'Aroon';

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;
  this.input = 'candle';

  log.debug('bullup = ' + this.settings.bullup + ', bulldown = ' + this.settings.bulldown);

  // start with a trend.state so either way your assets or currency
  // aren't being sold at the first glance. Let the strat do its work first
  this.trend = 'none';

  // define the indicators we need
  this.addTulipIndicator('myAroon', 'aroon', {
    optInTimePeriod: this.settings.optInTimePeriod
  });
}

// What happens on every new candle?
method.update = function(candle) {
  // here we pull two results from the indicator.
  // If you want to know all values, uncomment the line in the "method.log" section.
  aroonUp = this.tulipIndicators.myAroon.result.aroonUp;
  aroonDown = this.tulipIndicators.myAroon.result.aroonDown;

}

method.log = function(candle) {
  // Uncomment below to show all variables from this indicator (messy!)
  //log.debug('\t', this.tulipIndicators.myAroon);
}

method.check = function(candle) {
  // Based on the newly calculated information, check if we should update or not.

  //going red = Bear = SELLLLL
  if (aroonUp > this.settings.bullup && aroonDown < this.settings.bulldown && this.trend.state !== 'short') {
    this.trend.state = 'short';
    this.advice('short');
  }

  //going green = Bull = BUYYYYY
  if (aroonDown > this.settings.beardown && aroonUp < this.settings.bearup && this.trend.state !== 'long') {
    this.trend.state = 'long';
    this.advice('long');
  }

}

module.exports = method;