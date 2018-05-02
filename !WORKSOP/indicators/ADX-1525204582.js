// Average Directional Movement Index indicator;
// usable on gekko trading bot. Same license as gekko.
// "ported" from tulip: https://tulipindicators.org/adx
// gab0 - 2018

var DX = require('./DX.js');

var Indicator = function (period)
{
    this.input = 'candle';
    this.indicates = 'trend_strength';

    this.dx = new DX(period);

    this.result = 0;
    this.periodRatio = (period - 1)/period;
    this.initadx = 0;
    this.initialized = 1;
    this.period = period;
}

Indicator.prototype.update = function (candle)
{
    this.dx.update(candle);

    if (this.initialized > this.period)
        this.result = this.periodRatio * this.result + this.dx.result/this.period;
    else if (this.initialized == this.period)
    {
        this.initialized++;
        this.result = this.initadx / this.period;

    } else if (this.dx.result)
    {
        this.initadx += this.dx.result;
        this.initialized +=1;
    }

    this.age++
}

module.exports = Indicator;
