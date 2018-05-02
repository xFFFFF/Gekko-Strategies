var log = require('../core/log.js');
var config = require ('../core/util.js').getConfig();

var strategy = {
  
  init : function() {
    this.name = 'Schaff Trend Cycle With StopLoss';
    this.settings.threshold_high ? this.threshold_high = this.settings.threshold_high : this.threshold_high = 80;
    this.settings.threshold_low ? this.threshold_low = this.settings.threshold_low : this.threshold_low = 20;
    this.settings.threshold_adjustment ? this.threshold_adjustment = this.settings.threshold_adjustment : this.threshold_adjustment = 5;
    this.settings.adjust_false_signal ? this.adjust_false_signal = this.settings.adjust_false_signal : this.adjust_false_signal = true;
    this.settings.enable_stop_loss ? this.enable_stop_loss = this.settings.enable_stop_loss : this.enable_stop_loss = true;
    
    this.addIndicator('STC', 'STC', this.settings);
    if(this.enable_stop_loss)
    {
      this.addIndicator('zTrailingStop', 'zTrailingStop', this.settings.stoploss_threshold);
    }
  },
  update : function(candle)
  {
  },
  log:  function() {
  },

  check : function(candle) {

    if(this.enable_stop_loss && this.indicators.zTrailingStop.shouldSell)
    {
      this.indicators.zTrailingStop.short(candle.close);
      return this.advice('short');
    }

    const result = this.indicators.STC.result;
    const previousResult = this.indicators.STC.previousResult;
    //up from 25 to indicate a long or turns down from 75 to indicate a short.
    const longConditions = [
      this.trend !== 'long',
      result >= this.threshold_low,
      previousResult < this.threshold_low
      ].reduce((total, long) => long && total, true);

    const shortConditions = [
      this.trend !== 'short',
      result <= this.threshold_high,
      previousResult > this.threshold_high
      ].reduce((total, short) => short && total, true);

    const falseSignalLongConditions = [
      this.adjust_false_signal,
      this.trend == 'short',
      result > this.threshold_high + this.threshold_adjustment
      ].reduce((total, long) => long && total, true);

    const falseSignalShortConditions = [
      this.adjust_false_signal,
      this.trend == 'long',
      result < this.threshold_low - this.threshold_adjustment
      ].reduce((total, short) => short && total, true);

    if(longConditions || falseSignalLongConditions){
      this.trend = 'long';
      this.indicators.zTrailingStop.long(candle.close);
      this.advice('long');
    }
    else if(shortConditions || falseSignalShortConditions){
      this.trend = 'short';
      this.indicators.zTrailingStop.short(candle.close);
      this.advice('short');
    }

  },

  end : function() {
    log.debug("Stoploss triggered: " + this.indicators.zTrailingStop.timesStopped + " times.")
  }
};

module.exports = strategy;
