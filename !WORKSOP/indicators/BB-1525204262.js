// required indicators: SMA;
// Bollinger Bands implementation;
// var SMA = require('./SMA.js');
// var Indicator = function(config) {
//     this.settings = config;

//     this.center = new SMA(config.TimePeriod);

//     this.lower=0;
//     this.middle=0;
//     this.upper=0;
// }

// Indicator.prototype.calcstd = function(prices, Average)
// {
//     var squareDiffs = prices.map(function(value){
//         var diff = value - Average;
//         var sqr = diff * diff;
//         return sqr;
//     });

//     var sum = squareDiffs.reduce(function(sum, value){
//         return sum + value;
//     }, 0);

//     var avgSquareDiff = sum / squareDiffs.length;

//     return Math.sqrt(avgSquareDiff);
// }

// Indicator.prototype.update = function(price) {
//     this.center.update(price);

//     this.middle = this.center.result;
//     var std = this.calcstd(this.center.prices, this.middle);

//     this.lower = this.middle - this.settings.NbDevDn * std;
//     this.upper = this.middle + this.settings.NbDevUp * std;
// }

// module.exports = Indicator;

// no required indicators
// Bollinger Bands - Okibcn implementation 2018-01-02

// var Indicator = function(BBSettings) {
//   this.input = 'price';
//   this.settings = BBSettings; 
//   // Settings:
//   //    TimePeriod: The amount of samples used for the average.
//   //    NbDevUp: The distance in stdev of the upper band from the SMA.   
//   //    NbDevDn: The distance in stdev of the lower band from the SMA.   
//   this.prices = [];
//   this.diffs = [];
//   this.age = 0;
//   this.sum = 0;
//   this.sumsq = 0;
//   this.upper = 0;
//   this.middle = 0;
//   this.lower = 0;
// }

// Indicator.prototype.update = function(price) {
//   var tail = this.prices[this.age] || 0; // oldest price in window
//   var diffsTail = this.diffs[this.age] || 0; // oldest average in window

//   this.prices[this.age] = price;
//   this.sum += price - tail;
//   this.middle = this.sum / this.prices.length; // SMA value
  
//   this.diffs[this.age] = (price - this.middle);
//   this.sumsq += this.diffs[this.age] * 2  - diffsTail * 2;
//   var stdev = Math.sqrt(this.sumsq) / this.prices.length;
  
//   this.upper = this.middle + this.settings.NbDevUp * stdev;
//   this.lower = this.middle - this.settings.NbDevDn * stdev;

//   this.age = (this.age + 1) % this.settings.TimePeriod
// }
// module.exports = Indicator;

// no required indicators
// Bollinger Bands - Okibcn implementation 2018-01-02
// hand0722 customized 2019-01-09

var Indicator = function(BBSettings) {
this.input = 'price';
this.settings = BBSettings;
// Settings:
// TimePeriod: The amount of samples used for the average.
// NbDevUp: The distance in stdev of the upper band from the SMA.
// NbDevDn: The distance in stdev of the lower band from the SMA.
this.prices = [];
this.diffs = [];
this.age = 0;   // age = Warm Up Period
this.sum = 0;
this.sumsq = 0;
this.upper = 0;
this.middle = 0;
this.lower = 0;
}

Indicator.prototype.update = function(price) {

var tail = this.prices[this.age] || 0; // oldest price in window
var diffsTail = this.diffs[this.age] || 0; // oldest average in window

this.prices[this.age] = price;
this.sum += price - tail;
this.middle = this.sum / this.prices.length; // SMA value

// your code:
// this.diffs[this.age] = (price - this.middle);
// customized code (see formula), we have to build a math.pow:
this.diffs[this.age] = Math.pow((price - this.middle), 2);

// your code:
// this.sumsq += this.diffs[this.age] ** 2 - diffsTail ** 2;
// customized code:
this.sumsq += this.diffs[this.age] - diffsTail;

// your code:
// var stdev = Math.sqrt(this.sumsq) / this.prices.length;
// customized code (see formula), we have to build a math.sqrt over the whole expression:
var stdev = Math.sqrt(this.sumsq / this.prices.length);

this.upper = this.middle + this.settings.NbDevUp * stdev;
this.lower = this.middle - this.settings.NbDevDn * stdev;

this.age = (this.age + 1) % this.settings.TimePeriod;

}
module.exports = Indicator;