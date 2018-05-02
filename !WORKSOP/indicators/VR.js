// required indicators

var Indicator = function(settings) {
    this.avs = 0;
    this.bvs = 0;
    this.cvs=0;
    this.period = settings.period;
    this.historyCandle=new Array();
    this.vr=0;
    };

Indicator.prototype.update = function(candle) {

    if (this.historyCandle.length < this.period) {
        this.historyCandle.unshift(candle);
    }
    else {
        this.historyCandle.unshift(candle);
        this.historyCandle.pop();
        this.calculateVR();
    }

    // var close = candle.close;
    // var prevClose = this.lastClose;
    // var low = candle.low;
    // var high = candle.high;
    //
    // var bp = close - Math.min(low, prevClose);
    // var tr = Math.max(high, prevClose) - Math.min(low, prevClose);
    //
    // this.firstLow.update(tr);
    // this.secondLow.update(tr);
    // this.thirdLow.update(tr);
    //
    // this.firstHigh.update(bp);
    // this.secondHigh.update(bp);
    // this.thirdHigh.update(bp);
    //
    // var first = this.firstHigh.result / this.firstLow.result;
    // var second = this.secondHigh.result / this.secondLow.result;
    // var third = this.thirdHigh.result / this.secondLow.result;
    //
    // this.uo = 100 * (this.firstWeight * first + this.secondWeight * second + this.thirdWeight * third) / (this.firstWeight + this.secondWeight + this.thirdWeight);
    //
    // this.lastClose = close;
}

Indicator.prototype.calculateVR = function() {
    this.avs=0;
    this.bvs=0;
    this.cvs=0;
    for(var i=0;i<this.historyCandle.length;i++){
        if(this.historyCandle[i].open<this.historyCandle[i].close){
            this.avs+=this.historyCandle[i].volume;
        }
        else if(this.historyCandle[i].open>this.historyCandle[i].close){
            this.bvs+=this.historyCandle[i].volume;
        }
        else{
            this.cvs+=this.historyCandle[i].volume;
        }
    }
    this.vr=((this.avs+this.cvs*0.5)/(this.bvs+this.cvs*0.5)*100).toFixed(2);
};


module.exports = Indicator;
/**
 * Created by jiaminli on 2017/7/12.
 */

