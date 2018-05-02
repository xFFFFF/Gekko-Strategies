
var Indicator = function(settings) {
  this.input = 'candle';
  this.acceleration = settings.optInAcceleration;
  this.maximum = settings.optInMaximum;
  this.result = 0;
  this.bull = true;
  this.start = settings.optInStart;
}

Indicator.prototype.update = function(candle) {
  if(this.result == 0) {
    this.result = candle.close;
    this.low1 = candle.low;
    this.high1 = candle.high;
    this.low2 = candle.low;
    this.high2 = candle.high;
    this.hp = candle.high;
    this.lp = candle.low;
    this.af = this.start;
    return;
  }

  if(this.bull){
    this.psar = this.result + this.af * (this.hp - this.result)
  } else {
    this.psar = this.result + this.af * (this.lp - this.result)
  }

  let reverse = false;

  if(this.bull){
    if(candle.low < this.psar){
      this.bull = false;
      reverse = true;
      this.psar = this.hp;
      this.lp = candle.low;
      this.af = this.start;
    }
  } else {
    if(candle.high > this.psar){
      this.bull = true;
      reverse = true;
      this.psar = this.lp;
      this.hp = candle.high;
      this.af = this.start;
    }
  }

  if(!reverse){
    if(this.bull){
      if(candle.high > this.hp){
        this.hp = candle.high;
        this.af = Math.min(this.af + this.acceleration, this.maximum);
      }
      if(this.low1 < this.psar)
        this.psar = this.low1;
      if(this.low2 < this.psar)
        this.psar = this.low2;
    } else {
      if(candle.low < this.lp){
        this.lp = candle.low;
        this.af = Math.min(this.af + this.acceleration, this.maximum);
      }
      if(this.high1 > this.psar)
        this.psar = this.high1;
      if(this.high2 > this.psar)
        this.psar = this.high2;
    }
  }

  this.low2 = this.low1;
  this.low1 = candle.low;
  this.high2 = this.high1;
  this.high1 = candle.high;
  this.result = this.psar;
}

module.exports = Indicator;
