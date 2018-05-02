/*

  Ichimoku - manuel.wassermann97@gmail.com 18/02/2018

 */


var Indicator = function(){
  this.input = 'candle';
  this.highs = new Array(52);
  this.lows = new Array(52);
  this.age = 0;

  this.tenkan = null;
  this.kijun = null;
  this.senkouSpanA = null;
  this.senkouSpanB = null;
  
}



Indicator.prototype.update = function(candle) {

  this.highs.push(candle.high);
  this.lows.push(candle.low);
  this.age++


if(this.age >= 52){
  // Calc
  this.tenkan = ( Math.max(...this.highs.slice(-9)) + Math.min(...this.lows.slice(-9)) ) / 2;
  this.kijun = ( Math.max(...this.highs.slice(-26)) + Math.min(...this.lows.slice(-26)) ) / 2;
  this.senkouSpanA = (this.tenkan + this.kijun) / 2;
  this.senkouSpanB = ( Math.max(...this.highs.slice(-52)) + Math.min(...this.lows.slice(-52)) ) / 2;
  }
}





module.exports = Indicator;


