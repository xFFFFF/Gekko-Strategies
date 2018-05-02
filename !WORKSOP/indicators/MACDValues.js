var IndicatorInterface = require('./IndicatorInterface.js');
var EMA = require('./EMA.js');


class MACDValues extends IndicatorInterface {
  constructor(config) {
    super(config);
    let MA = this.movingAverage();
    this.short = new MA({weight: config.short});
    this.long = new MA({weight: config.long});
    this.result = 0;
  }

  update(value) {
    this.result = this.short.update(value) - this.long.update(value);
    return this.result;
  }

  requiredParams() {
    return ['long', 'short'];
  }

  movingAverage() {
    return EMA;
  }
}

module.exports = MACDValues;