
const util = require('util');
var config = require('../core/util.js').getConfig();
var log = require('../core/log');
// Let's create our own method
var method = {};


// Prepare everything our method needs
	
method.init = function() {
	this.oldrsi = 0;
}




method.calculateRSI = function (closePrices, order)
{
  if (closePrices.length < order+1)
  {
    return [-1]; // not enough params
  }
  gains = [];
  losses = [];
  var issomething = 0;
  for (var i = closePrices.length-order-1; i < closePrices.length-1; i++)
  {
	  
	
    diff = closePrices[i+1] - closePrices[i];
    if (diff > 0) 
    {
      gains.push(diff);
      losses.push(0);
	  issomething = 1;
    }
    else if (diff < 0)
    {
      gains.push(0);
      losses.push(Math.abs(diff));
	  issomething = 1;
    }
    else
    {
      gains.push(0);
      losses.push(0);
    }
  }
  if(issomething == 1){
	avgGain = this.avgVector (gains);
	avgLoss = this.avgVector (losses);
	setup = avgGain / avgLoss;
	rsi = 100 - (100 / (1 + setup));
	return rsi;
  }else{
	return 0;
  }
}

method.sumVector = function (vector)
{
  var result = 0;
  sum = function (x) { result += x; }
  vector.forEach (sum);
  return result;
}

method.avgVector = function (vector)
{
  var result = this.sumVector (vector);
  if (!vector.length)
    return 0;
  else
    return result / vector.length;
}


method.update = function(candle) {
	this.counter++;	
	var price = this.candle.close;

	var rsi = this.calculateRSI(this.candleProps.close, 14);
	if(rsi == 0){
		rsi = this.oldrsi;
	}else{
		this.oldrsi = rsi;	
	}
	
	console.log("rsi = "+ rsi);
	
}


method.log = function() {
  // nothing!
}

// Based on the newly calculated
// information, check if we should
// update or not.
method.check = function() {

  
}

module.exports = method;


