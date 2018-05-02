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
var settings = config.custom;

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.currentTrend = 'long';
  this.requiredHistory = 10;
  log.debug("Hello World");
  this.historyCandle=new Array();
    // how many candles do we need as a base
    // before we can start giving advice?
  this.requiredHistory = config.tradingAdvisor.historySize;

  this.trend = {
      last_buy_price: 0,
      action: 'short',
      duration: 0,
      persisted: false,
      adviced: false,
      latest_candle: null
  };


}

// What happens on every new candle?
strat.update = function(candle) {
  if (this.historyCandle.length<this.requiredHistory){
    this.historyCandle.unshift(candle);
  }
  else{
    this.historyCandle.unshift(candle);
    this.historyCandle.pop();
  }
  this.trend.latest_candle=candle;
  // Get a random number between 0 and 1.
  // this.randomNumber = Math.random();
  //
  // // There is a 10% chance it is smaller than 0.1
  // this.toUpdate = this.randomNumber < 0.1;
}

// For debugging purposes.
strat.log = function() {
  // log.debug('calculated random number:');
  // log.debug('\t', this.randomNumber.toFixed(3));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {
  // Only continue if we have a new update.
    var candle=this.trend.latest_candle;
    var candle_length = Math.abs(candle.open - candle.close);
    var candle_higher= Math.max(candle.open,candle.close);
    var candle_lower=Math.min(candle.open,candle.close);
    var longhand_length=Math.max(Math.abs(candle.high-candle_higher),Math.abs(candle.low-candle_lower));
    var shorthand_length=Math.min(Math.abs(candle.high-candle_higher),Math.abs(candle.low-candle_lower));
    if (longhand_length/candle_length>= settings.hammer_multiply){ // dumb version of the stuff
      // This is a possible point for buying & selling
        var avg_volume=0;
        for(var i=1;i<settings.volume_avg_date+1;i++){
          avg_volume+=this.historyCandle[i].volume;
        }
        avg_volume=avg_volume/settings.volume_avg_date;
        //check the volume
        // If the price is not right, sell it!


        if(this.trend.action==='long') {
            if (this.trend.last_buy_price!=0 & (candle.open + candle.close) / 2 < this.trend.last_buy_price * (1-settings.force_short_threshold)) {
                log.debug("Force selling!");
                this.trend.action = 'short';
                this.advice('short');
                return;
            }
        }
        if(candle.volume>=avg_volume){
            //make sure the volume is correct

          if(this.trend.action==='short'){
            // We are trying to find buy point.
              if(candle.open+candle.close>(this.historyCandle[settings.trend_date-1].open+this.historyCandle[settings.trend_date-1].close)){
                // The trend is correct.
                  var trend_avg=this.historyCandle[1].open+this.historyCandle[1].close;
                  for(var j=2;j<settings.trend_date+1;j++){
                      trend_avg+=this.historyCandle[j].open+this.historyCandle[j].close;
                  }
                  trend_avg=trend_avg/settings.trend_date;
                  if (trend_avg>candle.open+candle.close){
                    log.debug("Find a best Buy point!");
                    this.trend.action='long';
                    this.trend.last_buy_price=(candle.open+candle.close)/2;
                    this.advice('long');

                  }
              }
          }
          else if(this.trend.action==='long'){
            // We are trying to find a sell point.



              if(candle.open+candle.close<(this.historyCandle[settings.trend_date-1].open+this.historyCandle[settings.trend_date-1].close)){
                  // The trend is correct.
                  var trend_avg=this.historyCandle[1].open+this.historyCandle[1].close;
                  for(var j=2;j<settings.trend_date+1;j++){
                      trend_avg+=this.historyCandle[j].open+this.historyCandle[j].close
                  }
                  trend_avg=trend_avg/settings.trend_date

                  if (trend_avg<candle.open+candle.close){
                      log.debug("Find a best Sell point!");
                      this.trend.action='short';
                      this.advice('short');

                  }
              }

          }
        }


    }

};

module.exports = strat;