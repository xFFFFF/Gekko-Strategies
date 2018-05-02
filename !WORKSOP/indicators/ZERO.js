// MACD variant using Patrick Mulloy's ideas
// with additional mods by kuzetsa, 2014 June/July:

// Heikin-Ashi candles, etc.
// NOT QUITE based on xClose average
// ...weighted geometric mean instead
// this method should have less overshoot
// using ONLY x3EMA was a bit too jumpy

// additionally, a new "averaging window"
// this stats window determines percentiles
// currently: 5/10/25/40/50/60/75/90/95th
// "50th" percentile is the median price.

var x3EMA = require('./x3EMA.js');
var x2EMA = require('./x2EMA.js');
var windowstats = require('./windowstats.js');

var Indicator = function(config) {
  this.diff = false;
  this.shortC = new x3EMA(config.short);
  this.longC = new x3EMA(config.long);
  this.shortO = new x3EMA(config.short);
  this.longO = new x3EMA(config.long);
  this.shortL = new x3EMA(config.short);
  this.longL = new x3EMA(config.long);
  this.shortH = new x3EMA(config.short);
  this.longH = new x3EMA(config.long);
  this.signal = new x2EMA(config.signal);
  this.windowstats = new windowstats(config.window);
};

Indicator.prototype.update = function(candle) {
  var open = candle.o;
  var close = candle.c;
  var high = candle.h;
  var low = candle.l;
  var vwap = candle.p;

  this.windowstats.update(vwap);
  this.shortC.update(close);
  this.longC.update(close);
  this.shortO.update(open);
  this.longO.update(open);
  this.shortH.update(high);
  this.longH.update(high);
  this.shortL.update(low);
  this.longL.update(low);
  this.calculateEMAdiff();
  this.signal.update(this.diff);
  this.result = this.diff - this.signal.result;
};

Indicator.prototype.calculateEMAdiff = function() {

  var Sc = Math.pow(this.shortC.result, 3);
  var Lc = Math.pow(this.longC.result, 3);
  var So = this.shortO.result;
  var Lo = this.longO.result;
  var Sh = Math.pow(this.shortH.result, 2);
  var Lh = Math.pow(this.longH.result, 2);
  var Sl = Math.pow(this.shortL.result, 2);
  var Ll = Math.pow(this.longL.result, 2);
  var eightroot = 1 / 8;

  var short = Math.pow((Sc * So * Sh * Sl), eightroot);
  var long = Math.pow((Lc * Lo * Lh * Ll), eightroot);

  this.diff = short - long;
};

module.exports = Indicator;
