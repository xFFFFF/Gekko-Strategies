/*
Quick Stop Loss Strategy Extension which forwards function calls to this.strategy_${function}
Currently configurable via config file or within the backtest parameters

# config file

config.stop = {
  enabled: true,
  loss: 0.1,
  type: 'trailing|fixed'
}

# backtest

[stop]
loss = 0.1
type = 'trailing|fixed'

*/

var log = require('../core/log');

var stop = {};

stop.init = function() {
  this.loss = -1;

  if (this.stoploss) {
    this.on('advice', function (advice) {
      if (advice.recommendation !== 'long') {
        return;
      }

      var price = advice.candle.close;
      this.loss = price - (price * this.stoploss.percentage);
    });
  }

  // init the strategy
  if (this.strategy_init) {
    this.strategy_init();
  }
}

// update the strategy
stop.update = function(candle) {
  if (this.strategy_update) {
    this.strategy_update(candle);
  }
}

stop.log = function(candle) {
  if (this.loss !== -1) {
    log.info('Active ' + this.stoploss.type + ' Stop Loss at ' + this.loss);
  }

  if (this.strategy_log) {
    this.strategy_log(candle);
  }
}

// eventually moving the stop loss price up if a trailing stop loss is used.
// checking the stop loss price and going short if nessessary.
// forwarding the candle to the strategy otherwise.
stop.check = function(candle) {
  if (this.loss === -1) {
    if (this.strategy_check) {
      return this.strategy_check(candle);
    }

    return;
  }

  // stop loss enabled
  var price = candle.close;

  if (this.stoploss.type === 'trailing') {
    var newLoss = price - (price * this.stoploss.percentage);

    if (this.loss < newLoss) {
      this.loss = newLoss;
    }
  }

  if (price <= this.loss) {
    log.info('🔥 Stop Loss reached! Going short');
    this.advice('short');
    this.loss = -1;
    return;
  }

  if (this.strategy_check) {
    return this.strategy_check(candle);
  }
}

module.exports = stop;
