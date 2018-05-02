var Indicator = function() {
  this.input = 'candle';

  this.atr = null;
  this.trueRange = new Array(14);
  this.i = 0;
}

Indicator.prototype.update = function(candle) {


  if(this.prevCandle){

    this.method1 = candle.high - candle.low;
    this.method2 = Math.abs(candle.high - this.prevCandle.close);
    this.method3 = Math.abs(candle.low - this.prevCandle.close);
    
    this.tr = Math.max(method1, method2, method3);

    // Delete First entry and than add new entrie to keep the array size at 14
    this.trueRange.shift();
    this.trueRange.push(this.tr);

    i++
  }


  // Very Basic ATR 
  if(this.i >= 14){
    var sum = this.trueRange.reduce(function(a, b) { return a + b; });
    this.atr = sum / this.trueRange.length;
  }

  this.prevCandle = candle;

}

module.exports = Indicator;
