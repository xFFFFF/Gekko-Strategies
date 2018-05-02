// required indicators
var MACD = require('./MACD.js');

var Indicator = function(config) {
  this.result = false;
  this.length = config.length;
  this.historyMACD = [0];
  this.historyPF = [0];
  this.fastLength = config.fastLength;
  this.slowLength = config.slowLength;
  this.factor = config.factor;
  this.MACD = new MACD({ short: this.fastLength, long: this.slowLength, signal: 0 });
  this.last = { f1: 0, f2: 0, pf: null, pff: null };
}

Indicator.prototype.update = function(price) {
  this.MACD.update(price);

  const m = this.MACD.diff;

  this.historyMACD.unshift(m);
  this.historyMACD = this.historyMACD.splice(0, this.length + 1);

  const v1 = Math.min(...this.historyMACD);
  const v2 = Math.max(...this.historyMACD) - v1;

  const f1 = v2 > 0 ? ((m - v1) / v2) * 100 : this.last.f1;

  const pf = this.last.pf === null ? f1 : this.last.pf + (this.factor * (f1 - this.last.pf));

  this.historyPF.unshift(pf);
  this.historyPF = this.historyPF.splice(0, this.length + 1);

  const v3 = Math.min(...this.historyPF);
  const v4 = Math.max(...this.historyPF) - v3;

  const f2 = v4 > 0 ? ((pf - v3) / v4) * 100 : this.last.f2;
  this.result = this.last.pff === null ? f2 : this.last.pff + (this.factor * (f2 - this.last.pff));
  this.last = { f1, f2, pf, pff: this.result };
}

module.exports = Indicator;
