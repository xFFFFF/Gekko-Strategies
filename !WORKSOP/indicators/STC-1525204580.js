// Schaff Trend Cycle
var EMA =  require('./EMA.js');
var SO = require('./SO.js');
var MACDVals = require('./MACDValues.js');
var _ = require('lodash');
var IndicatorInterface = require('./IndicatorInterface.js');
var log = require('../../core/log.js');


class STC extends IndicatorInterface {
  constructor(config) {
    super(config);
    this.result = false;
    let MA = this.movingAverage();
    this.macdVals = new MACDVals( {short: config.short, long: config.long} );
    this.stochMacd = new SO( {period: config.interval} );
    this.smoothStochMacd = new MA( {weight: config.interval} );
    this.pf = new SO( {period: config.interval});
    this.stc = new MA( {weight: config.interval} );
    this.input = 'price';
  }

  update(price) {
    this.macdVals.update(price);
    this.stochMacd.update(this.macdVals.result);
    this.smoothStochMacd.update(this.stochMacd.result);
    this.pf.update(this.smoothStochMacd.result);
    this.stc.update(this.pf.result);
    this.result = this.stc.result;
    return this.result;
  }

  requiredParams() {
    return ['long', 'short', 'interval'];
  }

  largestPeriod() {
    let largest = _.max([this.config.long, this.config.short, this.config.interval]);
    this.largestPeriod = () => { return largest; };
    return largest;
  }

  movingAverage() {
    return EMA;
  }
}

module.exports = STC;
