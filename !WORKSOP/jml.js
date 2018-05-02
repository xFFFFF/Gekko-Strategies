var request = require('sync-request');
var log = require('../core/log');

var strat = {};

strat.init = function() {
  this.input = 'candle';
  this.requiredHistory = 0;
  this.candles = []
  this.direction = 'open';
  this.duration = 0;
  this.url = this.settings.url;
  this.threshold = this.settings.threshold || 2;
}

strat.update = function(candle) {
  this.candles.push(candle);
  if (this.candles.length > 200) {
    this.candles.splice(0, 1);
  }
  // log.debug(candle.start)
}

strat.log = function() {
}

strat.check = function(candle) {
  var price = candle.close;
  var position;

  try {
    var res = request('POST', this.url, {
      json: this.candles,
    });
    log.debug('request', res.getBody().toString());
    var resText = res.getBody().toString();
    var predicted = parseInt(resText);
    if (Number.isNaN(predicted)) {
      position = resText;
    } else {
      if (predicted > 50) {
        position = 'long';
      } else if (predicted < 50) {
        position = 'short';
      } else {
        position = 'open';
      }
    }
  } catch (error) {
    log.error('reqeust failed', error)
  }

  if (position == this.direction) {
    this.duration += 1;
  } else {
    if (position === 'long' || position === "short") {
      this.direction = position;
    }
    this.duration = 1;
  }

  if (this.duration == this.threshold && (position === 'long' || position === "short")) {
    log.debug('candle', candle);
    this.advice(position);
  } else {
    this.advice();
  }
}

module.exports = strat;
