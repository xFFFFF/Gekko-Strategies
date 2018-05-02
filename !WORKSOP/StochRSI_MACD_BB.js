/*
  StochRSI - SamThomp 11/06/2014
  (updated by askmike) @ 30/07/2016
  (5 - Simple Moving Average updated by martorth76) @ 12/12/2017
 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
	this.interval = this.settings.interval;
	this.arr = [0,0,0,0,0,0,0,0,0];

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
	this.addIndicator('rsi', 'RSI', { interval: this.interval });
	this.addIndicator('macd', 'MACD', this.settings);
	this.addIndicator('bb', 'BB', this.settings.bbands);
	this.RSIhistory = [];
}

// what happens on every new candle?
method.update = function(candle) {
	this.rsi = this.indicators.rsi.result;

	this.RSIhistory.push(this.rsi);

	if(_.size(this.RSIhistory) > this.interval)
		// remove oldest RSI value
		this.RSIhistory.shift();

	this.lowestRSI = _.min(this.RSIhistory);
	this.highestRSI = _.max(this.RSIhistory);
	//StochRSI Calculation
	this.stochRSI = ((this.rsi - this.lowestRSI) / (this.highestRSI - this.lowestRSI)) * 100;

	//try to create our own simple moving average
    this.arr.length = 9;
    this.arr.shift();
	this.arr.push(candle.close);
  	var sum=0;

      for(var i=0; i<this.arr.length; i++){
	    sum += this.arr[i];
	  }

	this.mySMA = sum/this.arr.length;

	log.debug('Moving Average: ',this.mySMA);
	
	
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  var digits = 8;

	log.debug('calculated StochRSI properties for candle:');
	log.debug('\t', 'rsi:', this.rsi.toFixed(digits));
	log.debug("StochRSI min:\t\t" + this.lowestRSI.toFixed(digits));
	log.debug("StochRSI max:\t\t" + this.highestRSI.toFixed(digits));
	log.debug("StochRSI Value:\t\t" + this.stochRSI.toFixed(2));
	//MACD

	var macd = this.indicators.macd;
	var diff = macd.diff;
	var signal = macd.signal.result;
    // var BB = this.indicators.bb;
 	var price = candle.close;
	var macddiff = this.indicators.macd.result;
        //BB
        var BB = this.indicators.bb;
       //BB.lower; BB.upper; BB.middle are your line values 
    
	var MACDsaysBUY = macddiff > this.settings.thresholds.up;
	var MACDsaysSELL = macddiff <= this.settings.thresholds.down;
	var StochRSIsaysBUY = this.stochRSI < this.settings.thresholds.low;
	var StochRSIsaysSELL = this.stochRSI >= this.settings.thresholds.high;
	var BBsayBUY = price >= (BB.middle-(BB.middle-BB.lower)/4);
	var BBsaySELL = price <= BB.lower; //>= BB.upper || price <= BB.lower 

	log.debug('calculated MACD properties for candle:');
	// log.debug('\t', 'short:', macd.short.result.toFixed(digits));
	// log.debug('\t', 'long:', macd.long.result.toFixed(digits));
	// log.debug('\t', 'macd:', diff.toFixed(digits));
	log.debug('\t', 'signal:', signal.toFixed(digits));
	log.debug('\t', 'macdiff:', macd.result.toFixed(digits));

    // log.debug('\t', 'BB.lower:', BB.lower.toFixed(digits));
	// log.debug('\t', 'BB.middle:', BB.middle.toFixed(digits));
	// log.debug('\t', 'BB.upper:', BB.upper.toFixed(digits));
	log.debug('\t', 'price', price.toFixed(digits));
	if(BBsayBUY) {
		log.debug('\t', 'BBsaysBUY');
	}
	if(MACDsaysBUY) {
		log.debug('\t', 'MACDsaysBUY');
	}
	if(StochRSIsaysBUY) {
		log.debug('\t', 'StochRSIsaysBUY');
	}
	if(BBsaySELL) {
		log.debug('\t', 'BBsaysSELL');
	}
	if(MACDsaysSELL) {
		log.debug('\t', 'MACDsaysSELL');
	}
	if(StochRSIsaysSELL) {
		log.debug('\t', 'StochRSIsaysSELL');
	}
	// if(MACDsaysSELL && StochRSIsaysSELL) {
 //       		log.debug('\t', 'StochRSIsaysSELL and MACDsaysSELL');
	// }
	// if(MACDsaysBUY && StochRSIsaysBUY && BBsayBUY) {
 //       		log.debug('\t', 'MACDsaysBUY and StochRSIsaysBUY and BBsaysBUY');
	// }
}

method.check = function(candle) {
	// Simple Moving Average threshold
	// var priceOver = this.mySMA * this.settings.mySMA.SMAup;
	// var priceUnder = this.mySMA * this.settings.mySMA.SMAdown;
	//MACD
	var macddiff = this.indicators.macd.result;
    //BB
    var BB = this.indicators.bb;
   	//BB.lower; BB.upper; BB.middle are your line values 
	var price = candle.close;
    //buy when stochRSI in low and MACD in up
	//short->sell, long->buy

	// var SMASaysSell = (this.mySMA < price && price < priceOver);
	// var SMASaysBuy = (this.mySMA > price && price > priceUnder);
     
	var MACDsaysBUY = macddiff > this.settings.thresholds.up;
	var MACDsaysSELL = macddiff <= this.settings.thresholds.down;
	var StochRSIsaysBUY = this.stochRSI < this.settings.thresholds.low;
	var StochRSIsaysSELL = this.stochRSI >= this.settings.thresholds.high;
	var BBsayBUY = price >= (BB.middle-(BB.middle-BB.lower)/4);
	var BBsaySELL = price <= BB.lower; //>= BB.upper || price <= BB.lower 
        if(MACDsaysSELL && StochRSIsaysSELL) {
		// new trend detected
		if(this.trend.direction !== 'high')
			this.trend = {
				duration: 0,
				persisted: false,
				direction: 'high',
				adviced: false
			};

		this.trend.duration++;

		log.debug('In high since', this.trend.duration, 'candle(s)');

		if(this.trend.duration >= this.settings.thresholds.persistence )
			this.trend.persisted = true;

		if(this.trend.persisted && !this.trend.adviced) {
			this.trend.adviced = true;
			this.advice('long');
			console.log("buying BTC @", candle.close);
		} else
			this.advice();

	} 
	//buy when stochRSI in high and MACD in low	&& BBsayBUY
	else if(MACDsaysBUY && StochRSIsaysBUY  && BBsayBUY) {

		// new trend detected
		if(this.trend.direction !== 'low')
			this.trend = {
				duration: 0,
				persisted: false,
				direction: 'low',
				adviced: false
			};

		this.trend.duration++;

		log.debug('In low since', this.trend.duration, 'candle(s)');

		if(this.trend.duration >= this.settings.thresholds.persistence)
			this.trend.persisted = true;

		if(this.trend.persisted && !this.trend.adviced) {
			this.trend.adviced = true;
			this.advice('short');
			console.log("selling BTC @", candle.close);
		} else
			this.advice();

	} else {
		// trends must be on consecutive candles
		this.trend.duration = 0;
		log.debug('In no trend');

		this.advice();
	}

}

module.exports = method;