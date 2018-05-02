// True Range indicator;
// compatible with Gekko Trading Bot. ported from tulip.
// Gab0 - 2018

var Indicator = function()
{


    this.input = 'candle'
    this.indicates = 'volatility';

    this.age = 0;
    this.result = 0;

    this.lastcandle = false;
}

Indicator.prototype.update = function(candle) {
    // The first time we can't calculate based on previous
    // ema, because we haven't calculated any yet.

    this.age++;

    if (this.lastcandle)
    {

        var TR_A = candle.high - candle.low;
        var TR_B = candle.high - this.lastcandle.close;
        var TR_C = candle.low - this.lastcandle.close;

        var TR_B = Math.abs(TR_B);
        var TR_C = Math.abs(TR_C);

        var TR = Math.max(TR_A, TR_B, TR_C);

        this.result = TR;

    }
    else
	  {
		    TR = candle.high - candle.low;

	  }

    this.lastcandle=candle;
}

    module.exports = Indicator;
