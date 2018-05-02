var log = require('../core/log.js');
var config = require ('../core/util.js').getConfig();

var strategy = {

  init : function() {
    this.name = 'Neural Network';
    this.requiredHistory = config.tradingAdvisor.historySize;

    this.addIndicator('NN', 'NN', this.settings);
    this.addIndicator('zTrailingStop', 'zTrailingStop', this.settings.stoploss_threshold);
  },
  update : function(candle)
  {
  },
  onTrade: function(event) {
    this.indicators.NN.onTrade(event);
  },

  check : function(candle) {
    if(this.indicators.zTrailingStop.shouldSell)
    {
      this.indicators.zTrailingStop.short(candle.close);
      return this.advice('short');
    }
      
    let NNResult = this.indicators.NN.check(candle);
    if(NNResult == 'long')
    {
      this.indicators.zTrailingStop.long(candle.close);
      return this.advice('long');
    }
    if(NNResult == 'short')
    {
      this.indicators.zTrailingStop.short(candle.close);
      return this.advice('short');
    }
      
  },

  end : function() {
    log.debug("Stoploss triggered: " + this.indicators.zTrailingStop.timesStopped + " times.")
  }
};

module.exports = strategy;
