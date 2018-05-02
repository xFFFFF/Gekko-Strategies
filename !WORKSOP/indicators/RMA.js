
var Indicator = function(weight) {
  this.input = 'price';
  this.weight = weight;
  this.result = false;
  this.age = 0;
}

Indicator.prototype.update = function(price) {
  // The first time we can't calculate based on previous
  // ema, because we haven't calculated any yet.
  if(this.result === false)
    this.result = price;

  this.age++;
  this.calculate(price);

  return this.result;
}

Indicator.prototype.calculate = function(price) {
  // weight factor
  var k = 1/this.weight;

  // yesterday
  var y = this.result;

  // calculation
  this.result = price * k + y * (1 - k);
}

module.exports = Indicator;
