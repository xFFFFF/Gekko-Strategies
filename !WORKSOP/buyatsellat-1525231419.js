// helpers
// var _ = require('lodash');
var log = require('../core/log.js');
var fs = require('fs');
var parseDecimalNumber = require('parse-decimal-number');
var Decimal = require('decimal.js');

//var config = require('../core/util.js').getConfig();
//var settings = config.buyatsellat;

// let's create our own method
var method = {};


// prepare everything our method needs
  method.init = function() {
  console.log('***********************Init initiated***********************');
  this.name = 'buyatsellat';

    fs.writeFile('2pac.txt', "geeko rocks!", { flag: 'wx' }, (err) => {  
        // throws an error, you could also catch it here
        if (err) {
          console.log('***********************readFile initiated***********************');
          readFile()
        }
        // success case, the file was saved
        else console.log('Creating first time!');
    });
    var action = fs.readFileSync("2pac.txt").toString()
    var splited = action.split(" ");
    this.previousActionPrice = Number.parseFloat(splited[1])
    this.previousAction = splited[0]
    console.log("Reading from file content action 1: ", splited[0]);
    console.log("Reading from file content previousActionPrice 1: ", this.previousAction);
    console.log("Reading from file content previousActionPrice 1: ", this.previousActionPrice);
}


// What happens on every new candle?
method.update = function(candle) {
  log.debug('in update');
  log.debug(this.previousActionPrice);
  log.debug(this.previousAction);
}

// for debugging purposes log the last 
// calculated parameters.
method.log = function(candle) {
  log.debug(this.previousAction)
  log.debug(this.previousActionPrice)
}

function readFile()
{
  fs.readFile("2pac.txt", function (err, data) {
            if (err) throw err;
            action = data.toString()
            console.log("Reading from file content : ", action);
            var splited = action.split(" ");
            this.previousActionPrice = splited[1]
            this.previousAction = splited[0]
            console.log("Reading from file content action 1: ", splited[0]);
            console.log("Reading from file content previousActionPrice 1: ", this.previousAction);
            console.log("Reading from file content previousActionPrice 1: ", this.previousActionPrice);
            // console.log("Reading from file content action 2: ". splited.toString());
        });


}

function writeToFile(previousAction, previousActionPrice)
{
  var content = previousAction + " " + previousActionPrice
  fs.writeFileSync('2pac.txt', content, { flag: 'w' }, (err) => {  
        console.log('Lyric saved!');
    });

}

method.check = function(candle) {  
  log.debug('check')
  log.debug(this.previousAction)
  log.debug(this.previousActionPrice)
  const buyat = 1.05; // profit limit percentage (e.g. 1.15 for 15%)
  const sellat = 0.95; // amount of percentage from last buy if market goes down (e.g. 0.97 for 3%)
  const stop_loss_pct = 0.00; // stop loss percentage (e.g. 0.95 for 5%)
  const sellat_up = 1.90; // amount of percentage from last buy if market goes up (e.g. 1.01 for 1%)

  if(this.previousAction === "buy") {
    // calculate the minimum price in order to sell
    const threshold = this.previousActionPrice * buyat;

    // calculate the stop loss price in order to sell
    const stop_loss = this.previousActionPrice * stop_loss_pct;

    // we sell if the price is more than the required threshold or equals stop loss threshold
    if((candle.close > threshold) || (candle.close < stop_loss)) {
      this.advice('short');
      this.previousAction = 'sell';
      this.previousActionPrice = candle.close;
      writeToFile(this.previousAction, this.previousActionPrice)
    }
  }

  else if(this.previousAction === "sell") {
  // calculate the minimum price in order to buy
    const threshold = this.previousActionPrice * sellat;

  // calculate the price at which we should buy again if market goes up
    const sellat_up_price = this.previousActionPrice * sellat_up;

    // we buy if the price is less than the required threshold or greater than Market Up threshold
    if((candle.close < threshold) || (candle.close > sellat_up_price)) {
      this.advice('long');
      this.previousAction = 'buy';
      this.previousActionPrice = candle.close;
      writeToFile(this.previousAction, this.previousActionPrice)
    }
  }
}

module.exports = method;
