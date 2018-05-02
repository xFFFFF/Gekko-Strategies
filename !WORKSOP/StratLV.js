// This strategy is very simple, 
// It should be able to make trades based on the SMA Indicator
// As price crosses the Indicator line from under, that signals a BUY.
// As price crosses the Indicator line from the top, that signals a SELL.

// The Indicator might be combined with others to derive a trend

// Indicator
// var SMA = require('./indicators/LV.js'); 
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

//let's create our method
var method = {};

//initialize everything this strat will need
method.init = function(){
	this.name = 'StratLV';

	this.previousAction = 'buy';
	this.arr = [0,0,0,0,0,0,0,0,0];
  	this.requiredHistory = 10;
  	this.price = 0;

}

method.update = function(candle){
	//try to create our own simple moving average
    this.arr.length = 9;
    this.arr.shift();
	this.arr.push(candle.close);
  	var sum=0;

      for(var i=0; i<this.arr.length; i++){
	    sum += this.arr[i];
	  }

	this.mySMA = sum/this.arr.length;
	this.prevPrice = this.price;
	this.price = candle.close;
	
	// log.debug(sum);
	// log.debug(arr[i]);
	log.debug('mySMA: ',this.mySMA.toFixed(4));
	log.debug("Current Price: ", this.price.toFixed(4));
	log.debug('Previous Price: ',this.prevPrice.toFixed(4));

}



method.log = function(candle){
	log.debug('Previous Action: ',this.previousAction);
}



method.check = function(candle){
	var price = candle.close;
	//create a margin... we need it to be very close to SMA line
	var priceOver = this.mySMA * 1.009;
	var priceUnder = this.mySMA * 0.001;
	//if price is under the SMA, we have to buy ( && this.prevPrice < this.mySMA)
	//if(500 < windowsize && windowsize < 600), && price < this.prevPrice
	if(this.mySMA < price && price < priceOver){
		if(this.previousAction == 'sell'){
			this.advice();
			this.previousAction = 'buy';
			this.prevPrice = price;
		}else{
			this.advice("long");
			this.previousAction = 'sell';
			this.prevPrice = price;
			log.debug('sold @ ',price);
		}
	}
// 	}else if(this.previousAction == 'buy'){ && this.prevPrice > this.mySMA,  && 
	if(this.mySMA > price && price > priceUnder){
		if(this.previousAction == 'buy'){
			this.advice();
			this.previousAction = 'sell';
			this.prevPrice = price;
		}else{
			this.advice('short');
			this.previousAction = 'buy';
			this.prevPrice = price;
			log.debug('bought @ ', price);			
		}
	}
}



module.exports = method;