// Source: https://raw.githubusercontent.com/trainerbill/gekko/develop/strategies/CUSTOM-RSI.js
// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies
var log = require('../core/log.js');
const Joi = require('joi');
// If you want to use your own trading methods you can
// write them here. For more information on everything you
// can use please refer to this document:
//
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md

// Let's create our own method
var method = {};

// Settings
const settings = Joi.object().keys({
  optInTimePeriod: Joi.number().min(1).default(14),
  long: Joi.number().min(1).max(49).default(25),
  short: Joi.number().min(51).max(99).default(75),
  buffer: Joi.number().min(1).max(20).default(3),  // Array size for RSI buffer
  bufferPercent: Joi.number().min(1).max(100).default(75)  // Percentage of buffer that must meet before advising
});

// Prepare everything our method needs
method.init = function(doAdvise = true) {
  this.name = 'CUSTOM-RSI'
  this.input = 'candle';
  this.doAdvise = doAdvise;
  this.lastAdvice = null;
  const validate = Joi.validate(this.settings.RSI, settings);
  if (validate.error) {
    throw validate.error;
  }

  this.buffer = [];

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  // this.addTalibIndicator('customPPO', 'ppo', this.settings.PPO);
  this.addTalibIndicator('customRSI', 'rsi', this.settings.RSI);

  log.debug("RSI Settings", this.settings.RSI);
}

// What happens on every new candle?
method.update = function(candle) {
  if (this.buffer.length >= this.settings.RSI.buffer) {
    this.buffer.shift();
  }
  this.buffer.push(this.talibIndicators.customRSI.result.outReal);
  this.short = this.buffer.filter(rsi => rsi >= this.settings.RSI.short);
  this.long = this.buffer.filter(rsi => rsi <= this.settings.RSI.long);
  this.sPercent = this.short.length / this.settings.RSI.buffer * 100;
  this.lPercent = this.long.length / this.settings.RSI.buffer * 100;
  
}

method.log = function() {
  log.debug("---------------RSI Log-----------------------");
  log.debug("RSI Buffer Length", this.buffer.length);
  log.debug("RSI Short length", this.short.length);
  log.debug("RSI Long length", this.long.length);
  log.debug("RSI Short Percentage", this.sPercent);
  log.debug("RSI Long Percentage", this.lPercent);
}

method.check = function(candle) {
  this.RSIadvice = "none";
  
  if (this.lPercent > 0 && this.lPercent >= this.settings.RSI.bufferPercent) {
    this.RSIadvice = 'long';
  } else if (this.sPercent && this.sPercent >= this.settings.RSI.bufferPercent) {
    this.RSIadvice = 'short';
  }

  if (this.doAdvise && this.lastAdvice !== this.RSIadvice) {
    this.advice(this.RSIadvice);
    if (this.RSIadvice !== "none") {
      this.lastAdvice = this.RSIadvice;
    }
    log.debug(`RSI Advice: ${this.RSIadvice}`);
  }
  
  return this.RSIadvice;
}

module.exports = method;
