var IndicatorInterface = require('./IndicatorInterface.js');
class Store extends IndicatorInterface {
  constructor(config) {
    super(config);
    this.historySize = config.length;
    this.input = 'price';
  }

  update(value) {
    this.result = value;
  }

  requiredParams() { 
    return ['length'];
  }
}

module.exports = Store;