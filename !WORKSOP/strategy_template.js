// The goal of this strategy is to demonstrate a general pattern for creating your strategies
// it uses expressions stored in arrays rather than excessive if else statements.
// It also demonstrates how to implement trailing stop losses and incorporate it
// This strategy will not make you money.
// For more information https://github.com/cloggy45

const helper = require('../helper.js');
const isMatch = require('lodash.ismatch');
const log = require('../core/log.js');

var strat = {};

strat.init = function() {
    
    this.stopLoss = helper.trailingStopLoss();
    this.stopLoss.percentage = this.settings.trailingStop.percentage;
    
    this.requiredHistory = this.settings.historySize;
    
    this.addTulipIndicator('myStoch', 'stoch', this.settings.myStoch)
    
    this.trend = 'none';
};

strat.update = function(candle) {
    this.stoch = this.tulipIndicators.myStoch.result;
};

strat.check = function(candle) {

    const currentPrice = candle.close;

    if(this.stopLoss.isTriggered(currentPrice)) {
        this.advice('short');
        this.stopLoss.destroy();
    }
       
    const longConditions = [
        this.trend !== 'long',
        this.stoch.stochK < this.settings.myStoch.lowThreshold,
        this.stoch.stochD < this.settings.myStoch.lowThreshold,
        ].reduce((total, long) => long && total, true);

    const shortConditions = [
        this.trend !== 'short',
        this.stoch.stochK > this.settings.myStoch.highThreshold,
        this.stoch.stochD > this.settings.myStoch.highThreshold,
        ].reduce((total, short) => short && total, true);    

    if(longConditions) {
        this.stopLoss.create(this.stopLoss.percentage, currentPrice);
        this.advice('long');
        
    } else if(shortConditions) {
        this.advice('short');
        this.stopLoss.destroy();
        
    } else {
        this.stopLoss.update(currentPrice);
        this.advice();
    }
    
    
};

module.exports = strat;
