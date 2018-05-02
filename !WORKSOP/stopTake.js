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

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.stopTake;

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function () {
    // this.currentTrend = 'long';
    this.positionOpen=false;
    this.requiredHistory = 0;
    this.stops=0;
    this.takes=0;
}

// What happens on every new candle?
strat.update = function (candle) {
    //
    // // Get a random number between 0 and 1.
    this.randomNumber = Math.random();
    //
    // // There is a 10% chance it is smaller than 0.1
    // this.toUpdate = this.randomNumber < 0.1;
}

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
    if (this.positionOpen) {
        let stop=candle.close<this.stopLoss;
        if (stop) this.stops++;
        let take=candle.close> this.takeProfit;
        if (take) this.takes++;
        if ( stop || take ) {
            this.advice('short');
            this.positionOpen=false;
        }
        console.log('stops:',this.stops,'takes:',this.takes,'t/s:',this.takes/this.stops);
    } else {
        if (this.randomNumber>0.8) {
            this.advice('long');
            this.positionOpen=true;

            this.stopLoss=candle.close*(1.0-settings.r);
            this.takeProfit=candle.close*(1.0+settings.profit_coef*settings.r);

        }
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