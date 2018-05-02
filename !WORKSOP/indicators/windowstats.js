// window stats by kuzetsa, 2014 July 12
// not quite a simple moving average
// contains a series of percentile ranks
// 5/10/25/40/50/60/75/90/95th
// the "50th" percentile is the median.

var BinarySearch = require('./BinarySearch.js');

var Indicator = function(period) {
  this.period = period;
  this.window = [];
  this.sorted = [];
  this.enough = false;
  this.age = 0;
  this.p1st = 0;
  this.p5th = 0;
  this.p10th = 0;
  this.pFancyEighth = 0;
  this.p25th = 0;
  this.p40th = 0;
  this.p50th = 0;
  this.p60th = 0;
  this.p75th = 0;
  this.p90th = 0;
  this.p95th = 0;
  this.p99th = 0;
  this.p1ndx = Math.floor(this.period * (1 / 100));
  this.p5ndx = Math.floor(this.period * (5 / 100));
  this.p10ndx = Math.floor(this.period * (10 / 100));
  var FancyEight = (0 - (1 / 3)); // one over cube root 541
  FancyEight = Math.pow(541, FancyEight); // is aprox 1/8th
  this.pFancyEightNdx = Math.floor(this.period * FancyEight);
  this.p25ndx = Math.floor(this.period * (25 / 100));
  this.p40ndx = Math.floor(this.period * (40 / 100));
  this.p50ndx = Math.floor(this.period * (50 / 100));
  this.p60ndx = Math.floor(this.period * (60 / 100));
  this.p75ndx = Math.floor(this.period * (75 / 100));
  this.p90ndx = Math.floor(this.period * (90 / 100));
  this.p95ndx = Math.floor(this.period * (95 / 100));
  this.p99ndx = Math.floor(this.period * (99 / 100));
  this.vwap = 0;
};

Indicator.prototype.update = function(price) {
  var oldest = 0;
  var index = 0;
  var SearchTheArray = new BinarySearch(this.sorted);

  var SanitizedPrice = price; // catch floating point errors
  SanitizedPrice *= 100000000;
  SanitizedPrice = Math.round(SanitizedPrice);
  SanitizedPrice /= 100000000;
  this.vwap = SanitizedPrice; 

  if (this.age >= this.period) {
    this.enough = true;
  }

  if (this.enough) {
    oldest = this.window[0];
    // remove first (oldest) from...

    // incremental sorting array:
    index = SearchTheArray.BinarySearch(oldest);
    this.sorted.splice(index, 1); // remove only

    // moving window:
    this.window.shift();
  }

  this.age++;

  this.window.push(SanitizedPrice);

  index = SearchTheArray.BinarySearch(SanitizedPrice);
  this.sorted.splice(index, 0, SanitizedPrice); // insert only

  this.calculate();

  return this.p50th; // return the median as a default
};

Indicator.prototype.calculate = function() {
  this.p1st = this.sorted[this.p1ndx];
  this.p5th = this.sorted[this.p5ndx];
  this.p10th = this.sorted[this.p10ndx];
  this.pFancyEighth = this.sorted[this.pFancyEightNdx];
  this.p25th = this.sorted[this.p25ndx];
  this.p40th = this.sorted[this.p40ndx];
  this.p50th = this.sorted[this.p50ndx];
  this.p60th = this.sorted[this.p60ndx];
  this.p75th = this.sorted[this.p75ndx];
  this.p90th = this.sorted[this.p90ndx];
  this.p95th = this.sorted[this.p95ndx];
  this.p99th = this.sorted[this.p99ndx];
};

module.exports = Indicator;
