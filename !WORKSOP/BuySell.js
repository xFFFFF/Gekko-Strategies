var config = require('../core/util.js').getConfig();
var settings = config.BuySell;

// Let's create our own buy and sell strategy
var strat = {};

// Prepare everything our strat needs
strat.init = function(a) {
}

// What happens on every new candle?
strat.update = function(candle) {
  // your code!
}

// For debugging purposes.
strat.log = function() {
  // your code!
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function(candle) {
    // buy when it hits buy price
    if (candle.close <= settings.buy) {
        this.advice("long");
        // do some output
        console.log("buying @", candle.close);
        return;
    }

    // sell when it hits sell price
    if (candle.close >= settings.sell) {
        this.advice("short");
        // do some output
        console.log("selling @", candle.close);
        console.log("Profit:", (candle.close-this.buyPrice));
        return;
    }
}

module.exports = strat;
