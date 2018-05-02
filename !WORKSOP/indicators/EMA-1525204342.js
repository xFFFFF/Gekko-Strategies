let IndicatorInterface = require('./IndicatorInterface.js');

class Indicator {

  constructor(config) {
      this.input = 'price';
      this.weight = config['weight'];
      this.result = false;
      this.age = 0;

  }

  requiredParams() { return ['weight']; }

  get result() { return this._result; }

  set result(res) {
    this.age++;
    this._result = res;
  }

  update(price) {
    return (
      this.result = (this.result === false) ? price : this.calculate(price)
    );
  }

  calculate(price) {
    const weight_factor = 2 / (this.weight + 1);
    const yesterday = this.result;
    return (price * weight_factor + yesterday * (1 - weight_factor));
  }

}

module.exports = Indicator;
