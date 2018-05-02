/*

Custom Strategy by Brandon Yuen
Using RSI

Market Target: binance (btc/xlm) 15min

*/

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
	this.interval = this.settings.interval || 3;
	this.trend = {
		direction: 'none',
		duration: 0,
		adviced: false
	};
	this.requiredHistory = this.tradingAdvisor.historySize;

	// define the indicators we need
	this.addIndicator('rsi', 'RSI', { interval: this.interval });
	this.RSIhistory = [];
	this.previousRsi = 0;

	log.debug('requiredHistory = ', this.requiredHistory);
}

// what happens on every new candle?
method.update = function(candle) {
	this.previousRsi = this.rsi;
	this.rsi = this.indicators.rsi.result;
	this.RSIhistory.push(this.rsi);

	if(_.size(this.RSIhistory) > this.requiredHistory) {
		// remove oldest RSI value
		this.RSIhistory.shift();
	}

	this.candleDateTime = (candle.start);
}

// for debugging purposes log the last
// calculated parameters.
method.log = function() {
	var digits = 8;

	log.debug('New Candle (', this.candleDateTime, '):');
	log.debug('\t', 'rsi:', this.rsi.toFixed(digits));
	log.debug('\t\t', 'previous:', this.previousRsi.toFixed(digits));
}

method.check = function() {

	if (this.rsi > this.previousRsi) {
		// New trend detected
		if (this.trend.direction !== 'up') {
			this.trend = {
				duration: 0,
				direction: 'up',
				adviced: false
			};
		}

		this.trend.duration++;

		log.debug('In uptrend since', this.trend.duration, 'candle(s)');

		// If this trend is not adviced yet (so it's a trend change)
		if (!this.trend.adviced) {
			this.trend.adviced = true;
			this.advice('long');
		} else {
			this.advice();
		}

	} else if (this.rsi < this.previousRsi) {

		// New trend detected
		if (this.trend.direction !== 'down') {
			this.trend = {
				duration: 0,
				direction: 'down',
				adviced: false
			};
		}

		this.trend.duration++;

		log.debug('In downtrend since', this.trend.duration, 'candle(s)');

		if (!this.trend.adviced) {
			this.trend.adviced = true;
			this.advice('short');
		} else {
			this.advice();
		}

	} else {
		// trends must be on consecutive candles
		this.trend.duration = 0;
		log.debug('In no trend');

		this.advice();
	}

	log.debug('\t');
}

module.exports = method;
