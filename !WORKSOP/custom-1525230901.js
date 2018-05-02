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
var config = require('../core/util.js').getConfig();

var SMA = require('./indicators/SMA.js');
var RVI = require('./indicators/RVI.js');

var settings = config.custom;

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.smaU = new SMA(settings.smaU);
	this.smaD = new SMA(settings.smaD);
	this.rvi = new RVI(settings);
	this.action = '';
	this.sma = false;
	this.lastaction = '';
}

// What happens on every new candle?
strat.update = function(candle) {

  	/* ********************
  	 * 		RSI com SMA   *
  	 * ********************/


  	this.smaU.update(candle.close);
  	this.smaD.update(candle.close);
  	this.rvi.update(candle);

  	this.sma = this.smaD.result > this.smaU.result;

  	//se currentsma, alta, se não, baixa
  	if (this.sma){
  		this.action = 'long';
  	}else{
  		this.action = 'short';
  	}

  	this.toUpdate = false;

  	if (this.rvi.action != 'noAction'){
  		if (this.action === this.rvi.action && this.action != this.lastaction){
  			this.currentTrend = this.action;
  			this.lastaction = this.action;
  			this.toUpdate = true;
  		}
  	}
}

// For debugging purposes.
strat.log = function() {

}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {

  // Only continue if we have a new update.
  if(!this.toUpdate)
    return;

  if(this.currentTrend === 'long') {

    // If it was long, set it to short
    this.currentTrend = 'short';
    this.advice('long');

  } else {

    // If it was short, set it to long
    this.currentTrend = 'short';
    this.advice('short');

  }
}

module.exports = strat;
