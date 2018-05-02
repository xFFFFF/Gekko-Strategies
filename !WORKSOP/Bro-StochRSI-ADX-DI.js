/*

Custom Strategy by Brandon Yuen
Using StochRSI

TODO: Add ADX & DI in combination with StochRSI to block sell/buy based on ADX & DI

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
	this.rsiInterval = this.settings.rsiInterval || 3;
	this.minAdx = this.settings.thresholds.minAdx || 0;
	this.trend = {
		direction: 'none',
		duration: 0,
		adviced: false
	};
	this.requiredHistory = this.tradingAdvisor.historySize;

	// define the indicators we need
	this.addIndicator('rsi', 'RSI', { interval: this.rsiInterval });
	this.RSIhistory = [];

	this.addTalibIndicator('adx', 'adx', {optInTimePeriod: this.requiredHistory})

	log.debug('requiredHistory = ', this.requiredHistory);
}

// what happens on every new candle?
method.update = function(candle) {
	this.candleDateTime = (candle.start);

	// =========================================
	//                 (Stoch) RSI
	// =========================================
	this.rsi = this.indicators.rsi.result;
	this.RSIhistory.push(this.rsi);

	if(_.size(this.RSIhistory) > this.requiredHistory) {
		// remove oldest RSI value
		this.RSIhistory.shift();
	}

	// Get rsi values
	this.lowestRSI = _.min(this.RSIhistory);
	this.highestRSI = _.max(this.RSIhistory);

	// Save current stoch RSI
	this.previousStochRSI = this.stochRSI;

	// Calculate new stoch RSI
	this.stochRSI = ((this.rsi - this.lowestRSI) / (this.highestRSI - this.lowestRSI)) * 100;

	// =========================================
	//                 ADX
	// =========================================
	this.previousAdx = this.adx;
	this.adx = this.talibIndicators.adx.result;
}

// for debugging purposes log the last
// calculated parameters.
method.log = function() {
	var digits = 8;

	log.debug('New Candle (', this.candleDateTime, '):');
	log.debug('\t', 'rsi:', this.rsi.toFixed(digits));
	log.debug('\t\t',"New StochRSI:\t\t" + this.stochRSI.toFixed(2));
	log.debug('\t\t',"Previous StochRSI:\t" + this.previousStochRSI.toFixed(2));
	log.debug('\t', 'adx:', this.adx);
	log.debug('\t\t', 'minAdx:', this.minAdx);
}

method.check = function() {
	// =========================================
	//                 ADX Trend
	// =========================================
	if (this.adx > this.previousAdx) {
	}

	// =========================================
	//                 (Stoch) RSI Trend
	// =========================================
	if (this.stochRSI > this.previousStochRSI) {
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
		if (this.adx > this.minAdx && !this.trend.adviced) {
			this.trend.adviced = true;
			this.advice('long');
		} else {
			this.advice();
		}
	} else if (this.stochRSI < this.previousStochRSI) {

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

		if (this.adx > this.minAdx && !this.trend.adviced) {
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
