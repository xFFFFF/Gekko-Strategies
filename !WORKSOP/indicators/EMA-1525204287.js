var Indicator = function(weight) {
  this.input = 'price';
  this.weight = weight;
  this.result = false;
  this.age = 0;
}

Indicator.prototype.update = function(price) {
  // 第一次进入，无法计算EMA值，因为没有yesterday
  if(this.result === false)
    this.result = price;

  this.age++;
  this.calculate(price);

  return this.result;
}

//  同上方公式，
//    calculation (based on tick/day):
//  EMA = Price(t) * k + EMA(y) * (1 – k)
//  t = today, y = yesterday, N = number of days in EMA, k = 2 / (N+1)
Indicator.prototype.calculate = function(price) {
  // weight factor
  var k = 2 / (this.weight + 1);

  // yesterday
  var y = this.result;
  
  // calculation
  this.result = price * k + y * (1 - k);
}

module.exports = Indicator;

