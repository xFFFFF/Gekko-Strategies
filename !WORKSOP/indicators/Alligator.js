var log = require('../../core/log');

var Indicator = function(settings) {
  this.depth = settings.history;
  this.result = false;
  this.age = 0;
  //this.history = [];
  this.high = [];
  this.low = [];
  this.x = [];
  
  this.SSMAJaws = 0;
  this.SSMATeeth = 0;
  this.SSMALips = 0;
  
  /*
   * Do not use array(depth) as it might not be implemented
   */
  for (var i = 0; i < this.depth; i++) {
      //this.history.push(0.0);
	  this.high.push(0.0);
	  this.low.push(0.0); 

      this.x.push(i);
  }

  log.debug("Created Alligator indicator with h: ", this.depth);
}

Indicator.prototype.update = function(candle) {
	  
	  // We need sufficient history to get the right result. 
	  if(this.result === false && this.age < this.depth) {

	    //this.history[this.age] = price;
	    this.high[this.age] = candle.high;
	    this.low[this.age] = candle.low;

	    this.age++;
	    this.result = false;
	    log.debug("Waiting for sufficient age: ", this.age, " out of ", this.depth); 
	    //
	    return;
	  }

	  this.age++;
	  // shift history
	  for (var i = 0; i < (this.depth - 1); i++) {
	      //this.history[i] = this.history[i+1];
	      this.high[i] = this.high[i + 1];
		  this.low[i] = this.low[i + 1];
	  }

	  //this.history[this.depth-1] = price;
	    this.high[this.depth-1] = candle.high;
	    this.low[this.depth-1] = candle.low;

	  this.calculate(candle);
	  return;
	}

*
* Handle calculations
*/
Indicator.prototype.calculate = function(candle) {
//Bill Williams Alligator for Think or Swim
//Mike Lapping 2010
//Extra steps were taken because I cannot find proper
//documentation of the average() function
//can be used and modified by anyone for any reason. do not sell.

	// We will now work on the SSMA called jaws
	var JOffset = 8;
	var Javg13 = ((this.high[12 + JOffset] + this.low[12 + JOffset]) / 2);
	var Javg12 = ((this.high[11 + JOffset] + this.low[11 + JOffset]) / 2);
	var Javg11 = ((this.high[10 + JOffset] + this.low[10 + JOffset]) / 2);
	var Javg10 = ((this.high[9 + JOffset] + this.low[9 + JOffset]) / 2);
	var Javg9 = ((this.high[8 + JOffset] + this.low[8 + JOffset]) / 2);
	var Javg8 = ((this.high[7 + JOffset] + this.low[7 + JOffset]) / 2);
	var Javg7 = ((this.high[6 + JOffset] + this.low[6 + JOffset]) / 2);
	var Javg6 = ((this.high[5 + JOffset] + this.low[5 + JOffset]) / 2);
	var Javg5 = ((this.high[4 + JOffset] + this.low[4 + JOffset]) / 2);
	var Javg4 = ((this.high[3 + JOffset] + this.low[3 + JOffset]) / 2); 
	var Javg3 = ((this.high[2 + JOffset] + this.low[2 + JOffset]) / 2);
	var Javg2 = ((this.high[1 + JOffset] + this.low[1 + JOffset]) / 2);
	var Javg1 = ((this.high[0 + JOffset] + this.low[0 + JOffset]) / 2);

	this.SSMAJaws = ( Javg1 + Javg2 + Javg3 + Javg4 + Javg5 + Javg6 + Javg7 + Javg8 + Javg9 + Javg10 + Javg11 + Javg12 + Javg13) / 13;

//Now working on Lips
	var LOffset = 5;
	var Lavg8 = ((this.high[7 + LOffset] + this.low[7 + LOffset]) / 2);
	var Lavg7 = ((this.high[6 + LOffset] + this.low[6 + LOffset]) / 2);
	var Lavg6 = ((this.high[5 + LOffset] + this.low[5 + LOffset]) / 2);
	var Lavg5 = ((this.high[4 + LOffset] + this.low[4 + LOffset]) / 2);
	var Lavg4 = ((this.high[3 + LOffset] + this.low[3 + LOffset]) / 2); 
	var Lavg3 = ((this.high[2 + LOffset] + this.low[2 + LOffset]) / 2);
	var Lavg2 = ((this.high[1 + LOffset] + this.low[1 + LOffset]) / 2);
	var Lavg1 = ((this.high[0 + LOffset] + this.low[0 + LOffset]) / 2);

	this.SSMALips = (Lavg1 + Lavg2 + Lavg3 + Lavg4 + Lavg5 + Lavg6 + Lavg7 + Lavg8) / 8;

//Work on teeth
	var TOffset = 3;

	var Tavg5 = ((this.high[4 + TOffset] + this.low[4 + TOffset]) / 2);
	var Tavg4 = ((this.high[3 + TOffset] + this.low[3 + TOffset]) / 2); 
	var Tavg3 = ((this.high[2 + TOffset] + this.low[2 + TOffset]) / 2);
	var Tavg2 = ((this.high[1 + TOffset] + this.low[1 + TOffset]) / 2);
	var Tavg1 = ((this.high[0 + TOffset] + this.low[0 + TOffset]) / 2);

	this.SSMATeeth = (Tavg1 + Tavg2 + Tavg3 + Tavg4 + Tavg5) / 5;

}

module.exports = Indicator;