// required indicators
var EMA = require('./EMA_tf.js');

var Indicator = function(config) {
  this.input = 'price';
  this.diff = false;
  this.period = config.period;
  this.short = new EMA(config.short, config.period);
  this.long = new EMA(config.long, config.period);
  this.signal = new EMA(config.signal, config.period);
  this.age = 0;
}

Indicator.prototype.update = function(price) {
  if(this.diff !== false) {
    this.age++;
  }
  this.short.update(price);
  this.long.update(price);
  this.calculateEMAdiff();
  this.signal.update(this.diff);
  this.result = this.diff - this.signal.result;

  if(this.age % this.period == 0) {
    let diff = this.short.lastresult - this.long.lastresult;
    this.crossover = this.diff>diff&&this.signal.result<this.signal.lastresult;
    this.crossunder = this.diff<diff&&this.signal.result>this.signal.lastresult;
  } else {
    this.crossover = false;
    this.crossunder = false;
  }
}

Indicator.prototype.calculateEMAdiff = function() {
  let shortEMA = this.short.result;
  let longEMA = this.long.result;

  this.diff = shortEMA - longEMA;
}

module.exports = Indicator;
