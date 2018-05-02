// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

var log = require('../core/log');
var CircularBuffer = require('circular-buffer');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.stopTrailing;

// Let's create our own strat
var strat = {};

class Stochastic {
    constructor(periods) {
        this.periods=periods;
        this.setupCompleted=false;
        this.k=0;
        this.d=0;
        this.kHistory=new CircularBuffer(3);
        this.candlesHistory=new CircularBuffer(this.periods);
    }

    newCandle(candle) {
        this.candlesHistory.enq(candle);
        if (this.candlesHistory.size()<this.periods) return;

        this.setupCompleted=true;

        let low = candle.low;
        let high = candle.high;

        for (let i = 0; i < this.periods; i++) {
            let elem = this.candlesHistory.get(i);
            low = Math.min(low, elem.low);
            high = Math.max(high, elem.high);
        }

        this.k=100*(candle.close - low)/(high-low);
        // console.log("K:",k);
        this.kHistory.enq(this.k);
        this.d=this.kHistory.toarray().reduce((a,b)=>a+b,0)/this.kHistory.size();
    }

}

class TimeFrameAccumulator {
    constructor(multiplicator) {
        this.multiplicator=multiplicator;
        this.buffer=new Array(multiplicator)
        this.bufferSize=0;
    }
    newCandle(candle) {
        this.buffer[this.bufferSize++]=candle;
        if (this.bufferSize==this.multiplicator) {
            let output=this.buffer.reduce((a,b)=>{
                return {low:Math.min(a.low,b.low),high:Math.max(a.high,b.high)}
            },candle);
            output.open=this.buffer[0].open;
            output.close=candle.close;
            this.bufferSize=0;
            return output;
        } else {
            return null;
        }
    }

}
// Prepare everything our method needs
strat.init = function () {
    // this.currentTrend = 'long';
    this.positionOpen=false;

    // stats
    this.stops=0;
    this.trails=0;
    this.evens=0;

    this.stochSizes=[settings.entry.stoch1,settings.entry.stoch2,settings.entry.stoch3];
    this.maxHistory=this.stochSizes.reduce((a,b)=>Math.max(a,b),0);
    this.requiredHistory = this.maxHistory+1;

    this.age=0;
    this.accumulators=settings.entry.timeFrames.map(
        tf=>new TimeFrameAccumulator(tf));
    this.stochastics=settings.entry.timeFrames.map(
        ()=>new Stochastic(settings.entry.stochastic));

    this.setupCompleted=false;

}


// What happens on every new candle?
strat.update = function (candle) {
    let allSetupsCompleted=true;
    for (let i=0;i<this.accumulators.length;i++) {
        let tfCandle=this.accumulators[i].newCandle(candle);
        if (tfCandle!=null) {
            // console.log("updating time frame",settings.entry.timeFrames[i]);
            this.stochastics[i].newCandle(tfCandle);
        }
        if (!this.stochastics[i].setupCompleted)
            allSetupsCompleted=false;
    }
    this.setupCompleted=allSetupsCompleted;
};

// For debugging purposes.
strat.log = function () {
    log.debug('position open:',this.positionOpen);
    console.log("i'm here");
    // log.debug('calculated random number:');
    // log.debug('\t', this.randomNumber.toFixed(3));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function (candle) {
    if (!this.setupCompleted) return;
    // console.log("k",this.stochastics[0].k[2]);
    if (this.positionOpen) {

        if (candle.close>this.peak) {
            this.peak = candle.close;
            this.trailing=this.peak*(1.0-settings.sizing.trailing);
        }

        if (candle.close>this.breakEven) {
            this.stopLoss=this.breakEven;
            this.stopRaised=true;
        }

        let stop=candle.close<this.stopLoss;
        if (stop) {
            if (this.stopRaised) this.evens++;
            else this.stops++;
        }
        let trail=candle.close<this.trailing;
        if (trail) this.trails++;

        if ( stop || trail ) {
            this.advice('short');
            this.positionOpen=false;
            console.log('-stops:',this.stops,'trails:',this.trails,'evens:',this.evens);
        }
    } else {
        let totalChecks=0;
        let okChecks=0;
        for (let i=0;i<settings.entry.timeFrames.length;i++) {
            totalChecks++;
            if (this.stochastics[i].k<settings.entry.tresholdMin)
                okChecks++;
        }

        if (okChecks/totalChecks > settings.entry.confidence) {
            console.log('entry:',this.stochastics[0].k,this.stochastics[1].k,this.stochastics[2].k,this.stochastics[3].k);
            this.advice('long');
            this.positionOpen=true;

            this.stopLoss=candle.close*(1.0-settings.sizing.r);

            this.peak=candle.close;
            this.trailing=this.peak*(1.0-settings.sizing.trailing);

            this.breakEven=candle.close*(1.0+settings.sizing.breakEven);
            this.stopRaised=false;

        }
        // else {
        //     console.log('rsi1:',this.indicators.rsi1.rsi);
        // }
    }

    // Only continue if we have a new update.
    // if(!this.toUpdate)
    //   return;
    //
    // if(this.currentTrend === 'long') {
    //
    //   // If it was long, set it to short
    //   this.currentTrend = 'short';
    //   this.advice('short');
    //
    // } else {
    //
    //   // If it was short, set it to long
    //   this.currentTrend = 'long';
    //   this.advice('long');
    //
    // }
}

module.exports = strat;