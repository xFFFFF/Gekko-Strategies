// required indicators - macd histogram
var EMA = require('./EMA.js');
var IndicatorInterface = require('./IndicatorInterface.js');
var MACDVals = require('./MACDValues.js');

class MACDHistogram extends IndicatorInterface {
  constructor(config) {
    super(config);
    this.input = 'price';
    this.diff = false;
    this.macdVals = new MACDVals( {short: config.short, long: config.long} );
    this.signal = new EMA( {weight: config.signal} );
  }

  update(price) {
    this.macdVals.update(price);
    this.signal.update(this.macdVals.result);
    this.result = this.macdVals.result - this.signal.result;
    return this.result;
  }
}

module.exports = MACDHistogram;
