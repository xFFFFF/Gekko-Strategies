// Directional Movement Indicator;
// for use on gekko trading bot. Same license as gekko.
// "ported" from tulip: https://tulipindicators.org/dx
// gab0 - 2018;

var ATR = require('./ATR.js');

var Indicator = function (period)
{

    this.input='candle';

    this.lastcandle = false;
    this.requiredHistory = period;
    this.period = period;

    this.age = 0;
    this.result = false;
    this.atr = new ATR(period);
    this.periodWeight = (period-1)/period;
    this.dm_up = 0;
    this.dm_down = 0;
}


Indicator.prototype.update = function (candle) {

    this.atr.update(candle);

    if (this.lastcandle)
    {

    var logicvalueA = candle.high - this.lastcandle.high;
    var logicvalueB = this.lastcandle.low - candle.low;

    // --DEFINE UP VALUE;
    if (logicvalueA < 0 || logicvalueA < logicvalueB)
    {
        var up = 0
    }
    else
    {
        var up = logicvalueA;

    }

    // --DEFINE DOWN VALUE;
    if (logicvalueB < 0 || logicvalueB < logicvalueA)
    {
        var down = 0;
    }
    else
    {
        var down = logicvalueB;
    }

        // --CALCULATE RESULT;
        this.dm_up = this.periodWeight * this.dm_up + up;
        this.dm_down = this.periodWeight * this.dm_down + down;

        this.di_up = this.dm_up/this.atr.result;
        this.di_down = this.dm_down/this.atr.result;

        var dm_diff = Math.abs(this.di_up - this.di_down);
        var dm_sum = this.di_up + this.di_down;
        if (this.age > this.period)
            this.result = 100 * dm_diff / dm_sum;
    }

    this.lastcandle = candle;
    this.age++;
}


module.exports = Indicator;
