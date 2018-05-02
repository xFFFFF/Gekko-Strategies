/**
 * Detect specific patterns.
 *
 * @author Philippe Prados
 * @see http://www.onlinetradingconcepts.com/TechnicalAnalysis
 */

var log = require('../core/log');
var config = require('../core/util.js').getConfig();

var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.requiredHistory = 0;
  this.addIndicator('patternsCandles', 'CandlesPatterns', config.CandlesPatterns);
  this.direction=0;
  this.persistence=config.CandlesPatterns.persistence;
  this.lastPrediction=0;
  this.confirm=0;
}

strat.update = function(candle) {
}

// For debugging purposes.
strat.log = function() {
  var patternsCandles=this.indicators.patternsCandles;
  if (patternsCandles.result != 0) {
    log.debug(((patternsCandles.result < 0) ? "Down":"Up")+" pattern="+patternsCandles.name);
  }
}

strat.check = function() {
  var patternsCandles=this.indicators.patternsCandles;

  if ((this.confirm>0) && (this.lastPrediction!=0)) {
    if (
      (this.lastPrediction < 0 && patternsCandles.last().pattern.direction < 0) ||
      (this.lastPrediction > 0 && patternsCandles.last().pattern.direction > 0)
    ) {
      --this.confirm;
    }
    else {
      // Not confirmed
      this.confirm=0;
      this.lastPrediction=0;
    }
    if (this.confirm == 0) {
      if (this.lastPrediction < 0) {
        this.advice('short');
        this.direction=-1;
        this.lastPrediction=0;
      }
      else if (this.lastPrediction > 0) {
        this.advice('long');
        this.direction=+1;
        this.lastPrediction=0;
      }
    }
  }
  if ((this.direction >= 0) && (patternsCandles.result < 0)) {
    if (this.persistence > 0) {
      this.confirm=this.persistence;
      this.lastPrediction = -1;
    }
    else {
      this.advice('short');
      this.direction=patternsCandles.result;
      this.confirm=this.direction;
    }
  }
  else if ((this.direction <= 0) && (patternsCandles.result > 0)) {
    if (this.persistence > 0) {
      this.confirm=this.persistence;
      this.lastPrediction = +1;
    }
    else {
      this.advice('long');
      this.direction = patternsCandles.result;
    }
  }
}

module.exports = strat;
