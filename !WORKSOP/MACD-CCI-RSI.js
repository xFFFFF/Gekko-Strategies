/*

	MIT License

	Copyright (c) 2018 Spiros Koutsopodiotis spiros@primous.org

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

*/

// helpers
var _ = require('lodash');
var log = require('../core/log.js');
var CCI = require('./indicators/MACD.js');
var CCI = require('./indicators/CCI.js');
var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
	this.name = 'MACD-CCI-RSI'; 
	
	this.trend = {
		direction: 'none',
		duration: 0,
		persisted: false,
		adviced: false
	};

	// how many candles do we need as a base before we can start giving advice?
	this.requiredHistory = this.tradingAdvisor.historySize;

	// define the indicators we need
	this.addIndicator('macd', 'MACD', this.settings.MACD);
	this.addIndicator('cci', 'CCI', this.settings.CCI);
	this.addIndicator('rsi', 'RSI', this.settings.RSI);
	
	// define the thresholds
	this.MACDup = this.settings.thresholds.MACDup;
    this.MACDdown = this.settings.thresholds.MACDdown;
	this.MACDpersistence = this.settings.thresholds.MACDpersistence;
	this.CCIup = this.settings.thresholds.CCIup;
	this.CCIdown = this.settings.thresholds.CCIdown;
	this.CCIpersistence = this.settings.thresholds.CCIpersistence;
	this.RSIlow = this.settings.thresholds.RSIlow;
	this.RSIhigh = this.settings.thresholds.RSIhigh;
	this.RSIpersistence = this.settings.thresholds.RSIpersistence;
}

// what happens on every new candle?
method.update = function(candle) {
	this.MACD = this.indicators.macd.result;
	this.CCI = this.indicators.cci.result;
	this.RSI = this.indicators.rsi.result;
}

// for debugging purposes: log the last calculated parameters.
method.log = function() {
//    log.debug(`
//===============================
// MACD: ${this.MACD}
// CCI:  ${this.CCI}
// RSI:  ${this.RSI}
//===============================
//`);
}

method.check = function() {
	if(this.MACD > this.MACDup && this.CCI > this.CCIup && this.RSI < this.RSIlow) {
    if(this.trend.direction !== 'up')
		this.trend = {
			direction: 'up',
			duration: 0,
			persisted: false,
			adviced: false
		};

    this.trend.duration++;

    log.info('In uptrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.MACDpersistence && this.trend.duration >= this.CCIpersistence && this.trend.duration >= this.RSIpersistence)
		this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
		this.trend.adviced = true;
		this.advice('long');
    } else
		this.advice();

	} else if(this.MACD < this.MACDdown && this.CCI < this.CCIdown && this.RSI > this.RSIhigh) {
	if(this.trend.direction !== 'down')
		this.trend = {
			direction: 'down',
			duration: 0,
			persisted: false,
			adviced: false
		};

    this.trend.duration++;

    log.info('In downtrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.MACDpersistence && this.trend.duration >= this.CCIpersistence && this.trend.duration >= this.RSIpersistence)
		this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
		this.trend.adviced = true;
		this.advice('short');
    } else
		this.advice();

	} else {
	if(this.trend.direction !== 'none')
		this.trend = {
			direction: 'none',
			duration: 0,
			persisted: false,
			adviced: false
		};
	
		this.trend.duration++;
		
		log.info('In no trend', this.trend.duration, 'candle(s)');
	
		this.advice();
	}
}

module.exports = method;
