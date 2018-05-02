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
  optInFastPeriod: Joi.number().min(1).default(12),
  optInSlowPeriod: Joi.number().min(1).default(26),
  optInMAType: Joi.number().min(0).default(0),
  long: Joi.number().min(1).max(49).default(25),
  short: Joi.number().min(51).max(99).default(75),
  buffer: Joi.number().min(1).max(20).default(3),  // Array size for RSI buffer
  bufferPercent: Joi.number().min(1).max(100).default(75)  // Percentage of buffer that must meet before advising
});

// Prepare everything our method needs
method.init = function(doAdvise = true) {
  this.name = 'CUSTOM-PPO'
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
  this.addTalibIndicator('customPPO', 'ppo', this.settings.PPO);

  log.debug("PPO Settings", this.settings.PPO);
}

// What happens on every new candle?
method.update = function(candle) {
  if (this.buffer.length >= this.settings.PPO.buffer) {
    this.buffer.shift();
  }
  this.buffer.push(this.talibIndicators.customPPO.result.outReal);
  this.short = this.buffer.filter(ppo => ppo >= this.settings.PPO.short);
  this.long = this.buffer.filter(ppo => ppo <= this.settings.PPO.long);
  this.sPercent = this.short.length / this.settings.PPO.buffer * 100;
  this.lPercent = this.long.length / this.settings.PPO.buffer * 100;
  
}

method.log = function() {
  log.debug(`---------------${this.name}---------------`);
  log.debug(`${this.name} Buffer Length`, this.buffer.length);
  log.debug(`${this.name} Short length`, this.short.length);
  log.debug(`${this.name} Long length`, this.long.length);
  log.debug(`${this.name} Short Percentage`, this.sPercent);
  log.debug(`${this.name} Long Percentage`, this.lPercent);
}

method.check = function(candle) {
  this.PPOdvice = "none";
  
  if (this.lPercent > 0 && this.lPercent >= this.settings.PPO.bufferPercent) {
    this.PPOadvice = 'long';
  } else if (this.sPercent && this.sPercent >= this.settings.PPO.bufferPercent) {
    this.PPOadvice = 'short';
  }

  if (this.doAdvise && this.lastAdvice !== this.PPOadvice) {
    this.advice(this.PPOadvice);
    if (this.PPOadvice !== "none") {
      this.lastAdvice = this.PPOadvice;
    }
    log.debug(`${this.name} Advice: ${this.PPOadvice}`);
  }
  
  return this.PPOadvice;
}

module.exports = method;
