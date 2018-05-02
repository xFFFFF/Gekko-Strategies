// @link http://en.wikipedia.org/wiki/Exponential_moving_average#Exponential_moving_average

var EMA = require('./EMA.js');

var Indicator = function(config) {


    this.age = 0;
    this.ema = new EMA(40);
    this.ema2 = new EMA(40);
    this.ema3 = new EMA(config.ema);
    this.ema3_weight = config.ema;
    this.result = false;
    this.ll = false;
    this.hh = false;
    this.prev = {};
};


Indicator.prototype.update = function(candle) {
    /* Candle.close .high .open .low */

    /* This.result == false by defaults, so if it's still false
     It means this is the first time we update the indicator */
    if(this.result === false) {
        // When we have no results we watch the first candle
        this.hh = candle.close;
        this.ll = candle.close;
    } else {
        this.hh = Math.max(candle.high, this.prev.close);
        this.ll = Math.min(candle.low, this.prev.close);
    }
    this.calculate(candle);


    this.prev.close = candle.close;
    return this.result;
};

// TMF = EMA[Volume *((Close - LL) / (HH - LL) * 2 - 1 )] / EMA[Volume] * 100
Indicator.prototype.calculate = function(candle) {
    var TMF;
    // {(Close - LL) - (HH - Close)} / {HH - LL}
    var Range = ((candle.close-this.ll)-(this.hh-candle.close))/(this.hh-this.ll);
    if (isNaN(Range))
        Range = 0;
    // console.log("ll", this.ll, "hh", this.hh, "close", candle.close);
    // console.log("range ->", Range);
    var RangeV = this.ema.update(Range * candle.volume);
    // console.log("rangeV ->", RangeV);
    var divisor = this.ema2.update(candle.volume);
    // console.log("divisor ->", divisor);
    if (divisor!=0)
        TMF = RangeV/divisor*100;
    else
        TMF = 100;
    // console.log("tmf->", TMF);
    if(this.ema3_weight!=0)
        this.result = this.ema3.update(TMF);
    else
        this.result = TMF;
    // console.log("result->", this.result);
};

module.exports = Indicator;
