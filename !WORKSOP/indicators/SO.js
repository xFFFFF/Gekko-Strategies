// Stochastic oscillator - also called %K
var IndicatorInterface = require('./IndicatorInterface.js');
var Store = require('./store.js');
var _ = require('lodash');
var log = require('../../core/log.js');

class SO extends IndicatorInterface {
  constructor(config) {
    super(config);
    this.historySize = config.period;
    this.store = new Store({length: config.period});
    this.input = 'price';
    this.age = 0;
  }

  update(value) {
    this.age++;
    this.store.update(value);

    if(this.age < this.config.period) {
      return (this.result = 50);
    }

    let min = _.min(this.store.history);
    let max = _.max(this.store.history);

    this.result = ((value - min) / (max - min)) * 100;
    return this.result;
  }

  requiredParams() { 
    return ['period']; 
  }
}

module.exports = SO;