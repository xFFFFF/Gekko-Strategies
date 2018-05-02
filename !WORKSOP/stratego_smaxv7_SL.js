// Copyright 2018
// Just kidding, do wtf you like and PROFIT!

var _ = require('lodash');
var log = require('../core/log.js');
 
var method = {};
method.init = function() {
    // strat name
    this.name = 'stratego_smaxv5_SL';

    // required settings, arrays, etc.
    this.stop = '';
    this.lastcandles = [];
    this.candleaverage = [];
    this.laststop = [];
    this.candlechange = '';
    this.lastbuyprice = '';
    this.buygiven = false;
    this.sellgiven = false;
    this.lastdiff = [];
    this.diffchange = '';
    this.typicalprice = '' ;

    this.stoploss = this.settings.stoploss;
    this.stophistory = this.settings.stophistory;
 
    // tulip indicators use this sometimes
    this.requiredHistory = this.settings.historySize;

    // define GA tulip parameters
 
    var fastsma_params = {optInTimePeriod: this.settings.fast_sma};
    var slowsma_params = {optInTimePeriod: this.settings.slow_sma};


    // define the indicators
 
    this.addTulipIndicator('myfastsma', this.settings.fastchoice, fastsma_params);
    this.addTulipIndicator('myslowsma', this.settings.slowchoice, slowsma_params);

}
 
// what happens on every new candle?
method.update = function(candle) {
    // tulip results
    this.fast = this.tulipIndicators.myfastsma.result.result;
    this.slow = this.tulipIndicators.myslowsma.result.result;

    // do a quick calculation of fast - slow to get a result for thresholds

    this.diff = (((this.fast - this.slow) / this.slow) * 100).toFixed(4);

    this.lastdiff.unshift(this.diff);
    if(this.lastdiff.length > 2){
	this.lastdiff.pop()
	};


    if (this.lastdiff[0] && this.lastdiff[1] > 0){
    this.diffchange = ((this.lastdiff[0] - this.lastdiff[1]) / this.lastdiff[1]) * 100;
	}
	else if (this.lastdiff[0] < 0 && this.lastdiff[1] > 0){
	this.diffchange = ((this.lastdiff[0] - this.lastdiff[1]) / this.lastdiff[1]) * 100;
	}
	else if (this.lastdiff[0] > 0 && this.lastdiff[1] < 0){
	this.diffchange = -(((this.lastdiff[1] - this.lastdiff[0]) / this.lastdiff[0]) * 100);
	}
	else if (this.lastdiff[0] <0 && this.lastdiff[1] < 0){
	this.diffchange = ((this.lastdiff[0] - this.lastdiff[1]) / Math.abs(this.lastdiff[1])) * 100;
	}


    // unshift last candle prices onto the array, check it's no bigger than stophistory, pop the end off if not
    // then work out the average, store it in another array of previous/current for trailing SL calc
    this.lastcandles.unshift((this.candle.high + this.candle.low + this.candle.close) / 3);
    if(this.lastcandles.length > this.stophistory){
	this.lastcandles.pop()
    	this.candleaverage.unshift(this.lastcandles.reduce((previous, current) => current += previous) / (this.lastcandles.length));
	};
    if(this.candleaverage.length < 2) {
    	};
    if(this.candleaverage.length > 2) {
	this.candleaverage.pop()
	};
    
    this.candlechange = (((this.candleaverage[0] - this.candleaverage[1]) / this.candleaverage[1]) * 100).toFixed(4);

    this.typicalprice = (this.candle.high + this.candle.low + this.candle.close) / 3

}
 
method.onTrade = function(trade){
 
}
 
// for debugging purposes log the last
// calculated parameters.
method.log = function() {
    log.debug(
`---------------------
 
Slow:      ${this.slow}
Fast:      ${this.fast}
Diff:      ${this.diff} %
EMA Chg:   ${this.diffchange} %
--
Typ price: ${this.typicalprice}
Price Chg: ${this.candlechange} %
SL:        ${this.stop}
`);
}
 
method.check = function() {
 

// if we've added a stop, if candlechange > 0 then update it, as long as the stored buy price has gone up
// if it has gone up, then 
  if (this.stop != '' && this.candlechange > 0 && (this.candle.high + this.candle.low + this.candle.close) / 3 > this.lastbuyprice){
	this.laststop.unshift(this.stop);
	log.debug('This stop currently: ', this.stop);
	log.debug('Last one was:', this.laststop[1]);
	this.stop = this.laststop[0] * ((this.candlechange / 100) + 1);
	log.debug('SL increased to: ', this.stop);
	this.lastbuyprice = this.stop
	};


// simple threshold check for short/long advice

 
  if (this.diff < this.settings.sma_down && this.sellgiven == false || this.diffchange < this.settings.change_down && this.sellgiven == false|| (this.candle.high + this.candle.low + this.candle.close) / 3 < this.stop) {
      log.debug('SELL SELL SELL!!!');
      this.advice('short');
      if ((this.candle.high + this.candle.low + this.candle.close) / 3 < this.stop){
      	log.debug('SL triggered @ ', this.stop);
	}
      this.stop = '';
      this.buygiven = false;
      this.sellgiven = true;


  } else if (this.diff > this.settings.sma_up && this.buygiven == false || this.diffchange > this.settings.change_up && this.buygiven == false) {
      if(this.stop=='') {
	this.stop = ((this.candle.high + this.candle.low + this.candle.close) / 3) * this.stoploss;
	this.laststop.unshift(this.stop);
	this.lastbuyprice = (this.candle.high + this.candle.low + this.candle.close) / 3;
      	log.debug('BUY BUY BUY!!!');
	log.debug('SL set @ ', this.stop);
      	this.advice('long');
	this.buygiven = true;
	this.sellgiven = false;
	}

  } else {
      log.debug('No advice at this time');
      this.advice();
  }
}
 
module.exports = method;