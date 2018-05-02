// inspired by Heikin-Ashi candles
// NOT QUITE based on xClose average
// ...weighted geometric mean instead

var EMA = require('./EMA.js');

var Indicator = function(config) {
  this.diff = false;
  this.shortC = new EMA(config.short);
  this.longC = new EMA(config.long);
  this.shortO = new EMA(config.short);
  this.longO = new EMA(config.long);
  this.shortL = new EMA(config.short);
  this.longL = new EMA(config.long);
  this.shortH = new EMA(config.short);
  this.longH = new EMA(config.long);
  this.signal = new EMA(config.signal);
}

Indicator.prototype.update = function(candle) {
  var open = candle.o;
  var close = candle.c;
  var high = candle.h;
  var low = candle.l;

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
}

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
}

module.exports = Indicator;
