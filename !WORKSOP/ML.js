// npm install neataptic --save
const neataptic = require('neataptic')
const _ = require('lodash');
const config = require ('../core/util.js').getConfig();
const async = require ('async');
const log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
    this.name = '007';
    this.requiredHistory = config.tradingAdvisor.historySize;
    this.price = 0;
    this.open_order = false;

    // preprate neural network
    this.network = new neataptic.architect.LSTM(1,9,1);
    this.trainingData = [];
    this.obj = {};
}

// what happens on every new candle? 
method.update = function(candle) {

    this.obj['input'] = [candle.open/20000]; // divide with 20k, normalizing our input and output
    this.obj['output'] = [candle.close/20000];

    // train the neural network
    this.trainingData.push(this.obj);
    this.network.train(this.trainingData, {
        log: 0,
        iterations: 1000,
        error: 0.03,
        rate: 0.005,
        clear: true
    });
   
}


method.log = function() {

}

// check is executed after the minimum history input
method.check = function(candle) {

    /* Candle information
    { id: 103956,
      start: moment("2018-02-04T00:00:00.000"),
      open: 9080.49,
      high: 9218.98,
      low: 9022,
      close: 9199.96,
      vwp: 9097.252446880359,
      volume: 802.5146890000001,
      trades: 8086 }
    */

    //let's predict the next close price on the current close price;
    var predicted_value = this.network.activate(candle.close/20000)*20000;

    // % change in current close and predicted close
    var percentage = ((predicted_value-candle.close)/candle.close)*100;

    if(percentage > 1 && !this.open_order)
    {
        log.info("Buy: $"+candle.close);
        this.price = candle.close;
        this.open_order = true;
        return this.advice('long');

    }else if(this.open_order){
        this.open_order = false;
        log.info("Sold: $"+candle.close);
        return this.advice('short');

    }

    return this.advice();
}

module.exports = method;
