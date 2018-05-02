class IndicatorInterface {
  constructor(config) {
    this.config = config;
    this._result = 0;
    this.validateParams();
  }

  get history() {
    this._historySize = this._historySize || 0;
    this._history = this._history || [];
    delete this.history;
    return this._history;
  }
  set history(element) {
    this.history.push(element);
    if(this._history.length >= this.historySize) {        
      this._history.shift();
    }
  }

  get historySize() { return this._historySize; }
  set historySize(size) { this._historySize = size; }

  get result() { return this._result; }
  set result(res) {
    this._result = res;
    this.history = res;
  }

  requiredParams() {
    return [];
  }
  
  validateParams() {
    if(typeof this.config !== 'object') {
      throw `${someClassInstance.constructor.name}: Passed parameters should be an object, got ${this.config} instead`;
    }
    for(let param of this.requiredParams()) {
      if(!(param in this.config)) {
        throw `${someClassInstance.constructor.name}: Param ${param} is missing.`;
      }
    }
  }
}

module.exports = IndicatorInterface;