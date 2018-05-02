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
  optInFastK_Period: Joi.number().min(1).default(5),
  optInFastD_Period: Joi.number().min(1).default(3),
  optInFastD_MAType: Joi.number().min(0).default(0),
  long: Joi.number().min(1).max(49).default(25),
  short: Joi.number().min(51).max(99).default(75),
  buffer: Joi.number().min(1).max(20).default(3),  // Array size for RSI buffer
  bufferPercent: Joi.number().min(1).max(100).default(75)  // Percentage of buffer that must meet before advising
});

// Prepare everything our method needs
method.init = function(doAdvise = true) {
    throw "Need to find out what outfastk and outfastd are on the stochris return"
  this.name = 'CUSTOM-STOCHRSI'
  this.input = 'candle';
  this.doAdvise = doAdvise;
  this.lastAdvice = null;
  const validate = Joi.validate(this.settings.STOCHRSI, settings);
  if (validate.error) {
    throw validate.error;
  }

  this.buffer = [];

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  // this.addTalibIndicator('customPPO', 'ppo', this.settings.PPO);
  this.addTalibIndicator('customSTOCHRSI', 'stochrsi', this.settings.STOCHRSI);

  log.debug("STOCHRSI Settings", this.settings.STOCHRSI);
}

// What happens on every new candle?
method.update = function(candle) {
  if (this.buffer.length >= this.settings.STOCHRSI.buffer) {
    this.buffer.shift();
  }
  log.debug("Result", this.talibIndicators.customSTOCHRSI);
  this.buffer.push(this.talibIndicators.customSTOCHRSI.result.outReal * 100);
  this.short = this.buffer.filter(rsi => rsi >= this.settings.STOCHRSI.short);
  this.long = this.buffer.filter(rsi => rsi <= this.settings.STOCHRSI.long);
  this.sPercent = this.short.length / this.settings.STOCHRSI.buffer * 100;
  this.lPercent = this.long.length / this.settings.STOCHRSI.buffer * 100;
  
}

method.log = function() {
  log.debug("---------------STOCHRSI Log-----------------------");
  log.debug("STOCHRSI Buffer Length", this.buffer);
  log.debug("STOCHRSI Short length", this.short.length);
  log.debug("STOCHRSI Long length", this.long.length);
  log.debug("STOCHRSI Short Percentage", this.sPercent);
  log.debug("STOCHRSI Long Percentage", this.lPercent);
}

method.check = function(candle) {
  this.STOCHRSIadvice = "none";
  
  if (this.lPercent > 0 && this.lPercent >= this.settings.STOCHRSI.bufferPercent) {
    this.STOCHRSIadvice = 'long';
  } else if (this.sPercent && this.sPercent >= this.settings.STOCHRSI.bufferPercent) {
    this.STOCHRSIadvice = 'short';
  }

  if (this.doAdvise && this.lastAdvice !== this.STOCHRSIadvice) {
    this.advice(this.STOCHRSIadvice);
    if (this.STOCHRSIadvice !== "none") {
      this.lastAdvice = this.STOCHRSIadvice;
    }
    log.debug(`STOCHRSI Advice: ${this.STOCHRSIadvice}`);
  }
  
  return this.STOCHRSIadvice;
}

module.exports = method;
