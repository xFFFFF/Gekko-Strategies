/**
 * The first value for the Smoothed Moving Average is calculated as a Simple Moving Average (SMA):

SUM1=SUM (CLOSE, N)

SMMA1 = SUM1/ N

The second and subsequent moving averages are calculated according to this formula:

SMMA (i) = (SUM1 – SMMA1+CLOSE (i))/ N

Where:

SUM1 – is the total sum of closing prices for N periods;
SMMA1 – is the smoothed moving average of the first bar;
SMMA (i) – is the smoothed moving average of the current bar (except the first one);
CLOSE (i) – is the current closing price;
N – is the smoothing period.
 */

// required indicators
var Indicator = function(weight) {
  this.weight = weight;
  this.prices = [];
  this.result = 0;
  this.age = 0;
}

Indicator.prototype.update = function(price) {
  this.prices[this.age % this.weight] = price;
  sum = this.prices.reduce(function(a, b) { return a + b; }, 0);
  this.result = sum / this.prices.length;
  this.age++;
}

module.exports = Indicator;
