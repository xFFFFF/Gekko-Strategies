var log = require('../core/log.js');

var strat = {};

strat.init = function() {
  this.name = 'Pha simple stupid strategy';

  this.addIndicator('pha', 'PHA', this.settings);
  this.requiredHistory = 3;
};

strat.update = function(candle) {
  this.indicators.pha.update(candle);
};

// for debugging purposes: log the last calculated
// EMAs and diff.
strat.log = function() {
  var pha = this.indicators.pha;

  log.debug('calculated PHA properties for candle:');
  log.debug('\t', 'result:', pha.result);
  log.debug('\t', 'history count:', pha.hist.length);
  log.debug('\t', '===================================================');
  var l = pha.hist.length;
  if (l > 0) {
    log.debug('\t', 'Time:', pha.hist[l - 1].start);
  }
  var printed = 0;
  while (l > 0 && printed < 3) {
    log.debug('\t', 'history:', pha.hist[l - 1]);
    l--;
    printed++;
  }
  log.debug('\t', '===================================================');
  //   log.debug('\t', 'history:', pha.hist);
};

strat.check = function() {
  const r = this.indicators.pha.result;

  if (r === 1) {
    this.advice('long');
  }
  if (r === -1) {
    this.advice('short');
  }
  if (r === 0) {
    this.advice();
  }
};

module.exports = strat;
