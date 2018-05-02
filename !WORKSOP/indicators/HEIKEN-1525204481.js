/*

  Heiken-Ashi - manuel.wassermann97@gmail.com 21/01/2018

 */


var Indicator = function(){
  this.input = 'candle';
  this.high = null;
  this.low = null;
  this.open = null;
  this.close = null;
}



Indicator.prototype.update = function(candle) {

  // Only calculate if we have an previous candle
  if(this.lastCandle){
    
    // heiken.close
    this.xClose = function(previous, current){
      return (previous.close+current.open+current.low+current.high)/4;
    }  
    
    // first heiken.open 
    // This is probably wrong
    first = true;
    if(first){
      this.xOpen = function(previous){
        return (previous.open+previous.close)/2;
        first = false;
      }

    // heiken.open 
    } else{
      this.xOpen = function(previous){
        return (this.xOpen(this.previousCandle)+this.xClose(this.previousCandle))/2;
      }
    }


    this.close = this.xClose(this.lastCandle, candle);
    this.open = this.xOpen(this.lastCandle, candle);

    // heiken.high
    this.high = Math.max(this.lastCandle.high,this.open,this.close);
    // heiken.low
    this.low = Math.min(this.lastCandle.low,this.open,this.close);
  }

// Remember last candle
this.lastCandle = candle;

}

module.exports = Indicator;


