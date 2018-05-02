// @link http://en.wikipedia.org/wiki/Exponential_moving_average#Exponential_moving_average

var Indicator = function(weight,period) {
  this.input = 'price';
  this.period = period;
  this.weight = weight;
  this.result = false;
  this.lastresult = false;
  this.age = 0;
}

Indicator.prototype.update = function(price) {
  if(this.result === false) {
    this.lastresult = this.result = price;
  } else {
    this.age++;
  }

  if(this.age % this.period == 0) {
    this.lastresult = this.result;
    this.result = this.calculate(price);
  }

  return this.result;
}

//    calculation (based on tick/day):
//  EMA = Price(t) * k + EMA(y) * (1 – k)
//  t = today, y = yesterday, N = number of days in EMA, k = 2 / (N+1)
Indicator.prototype.calculate = function(price) {
  // weight factor
  var k = 2 / (this.weight + 1);

  // yesterday
  var y = this.result;

  // calculation
  return price * k + y * (1 - k);
}

module.exports = Indicator;
