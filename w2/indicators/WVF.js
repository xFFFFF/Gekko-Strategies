/*
 * CM_Williams_Vix_Fix
 */
var log = require('../../core/log');

var Indicator = function(settings) {
    this.input = 'candle';

    this.pd = settings.pd;      // title="LookBack Period Standard Deviation High"
    this.bbl = settings.bbl;    // title="Bolinger Band Length")
    this.mult = settings.mult;  // minval=1, maxval=5, title="Bollinger Band Standard Devaition Up")
    this.lb = settings.lb;      // title="Look Back Period Percentile High")
    this.ph = settings.ph;      // title="Highest Percentile - 0.90=90%, 0.95=95%, 0.99=99%")

    this.candleHistory = [];
    this.candleHistorySize = Math.max(this.lb, this.pd)

    this.wvfHistory = [];
    this.isBottom = false;
}

Indicator.prototype.update = function(candle) {
    this.candleHistory.unshift(candle);
    while (this.candleHistory.length > this.candleHistorySize) this.candleHistory.pop();

    if(this.candleHistory.length == this.candleHistorySize)
    {
        this.isBottom = false;
        this.calculate();
    }
}

/*
 * Handle calculations
 */
Indicator.prototype.calculate = function() {
    const closes = this.candleHistory.map(e => e.close);
    const maxCloseInRange = Math.max.apply(null, closes.slice(0, this.pd));

    const wvf = ((maxCloseInRange - this.candleHistory[0].low)/maxCloseInRange)*100
    this.wvfHistory.unshift(wvf);

    if(this.wvfHistory.length < this.bbl)
        return;         // Not enough data to do analysis

    // Bottoms
    const averagewvf = average(this.wvfHistory.slice(0, this.bbl))
    const wvfSDeviation = this.mult * standardDeviation(this.wvfHistory.slice(0, this.bbl))

    const upperBand = averagewvf + wvfSDeviation

    const maxWvfInRange = Math.max.apply(null, this.wvfHistory.slice(0, this.lb));
    const rangeHigh = maxWvfInRange * this.ph
    this.isBottom = wvf >= upperBand || wvf >= rangeHigh
}

module.exports = Indicator;


function standardDeviation(values){
    var avg = average(values);

    var squareDiffs = values.map(function(value){
      var diff = value - avg;
      var sqrDiff = diff * diff;
      return sqrDiff;
    });

    var avgSquareDiff = average(squareDiffs);

    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
  }

  function average(data){
    var sum = data.reduce(function(sum, value){
      return sum + value;
    }, 0);

    var avg = sum / data.length;
    return avg;
  }