var _ = require('lodash');
var log = require('../core/log.js');

// Let's create our own strategy
/**
*   This is called the PINGPONG Trading Strategy. It is a very useful trading strategy, because the market ranges 80% of the time, as BUY and SELL forces try to take over the market.
	It works like this:
	 - We buy at a particular price (as determined by our calculations)
	 - We sell at a predetermined price higher than the buy price (profits generated $$$)
	We need the following variables:
	 - Previous Buy Point
	 - Previous Sell Point
	 - Threshold Range (that is, a fixed difference between our previous buy point and our intending sell point. It can be a %)
*
*/ 
var method = {};

method.init = function(){
	this.name = 'PingPong';

	this.arr = [];

	this.threshold = 0.099;
	this.requiredHistory = 10;
	this.trend = {
	    direction: 'undefined',
	    duration: 0,
	    persisted: false,
	    adviced: false
	}
	this.persisted = 3;
}
method.update = function(candle) {
	//try to create our own 5 - simple moving average
    this.arr.length = 20;
    this.arr.shift();
	this.arr.push(candle.close);
  	var sum=0;

      for(var i=0; i<this.arr.length; i++){
	    sum += this.arr[i];
	  }

	this.mySMA = sum/this.arr.length;
	log.debug('Price: ',candle.close);
	log.debug('Simple Moving Average: ',this.mySMA);
	log.debug('Volume: ',candle.volume);
}

method.log = function()  {
}

method.check = function(candle) {
	var price = candle.close;
	// var SMASaysBUY = price < this.mySMA;
	// if (this.arr[1]<this.arr[2]<this.arr[3]){
	// 	this.trend.direction = 'upward';
	// 	log.debug('>>>> ADVICE: BUY <<<<')
	// 	this.advice('long');
	// }
	// if(this.arr[1]>this.arr[2]>this.arr[3]){
	// 	this.trend.direction = 'downward';
	// 	log.debug('>>>> ADVICE: SELL <<<<')
	// 	this.advice('short');
	// }
	

}

module.exports = method;

//Fixed Gain Strategy
//if price is less than mySMA, and mySMA is about to gain, with persistence: BUY
//sell at price * threshold