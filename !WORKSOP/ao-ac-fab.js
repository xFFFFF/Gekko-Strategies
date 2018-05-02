/*BTC-ETH - settare optinfast 3 - settare optinslow 7 - time 2 ore */


var _ = require('lodash');
var log = require('../core/log.js');

// Let's create our own buy and sell strategy
var strat = {};

// Prepare everything our strat needs
strat.init = function() {
  this.priceclose = [];
  this.AOres = []; //array contenente lo storico di AO
  this.addTulipIndicator('myAO', 'ao', "");
//inserisco un altro indicatore
  this.ACres = [];
  this.RESaquire = 0;
  return;
}

// What happens on every new candle?
strat.update = function(candle) {
  this.priceclose.unshift(candle.close);
  this.AOres.unshift(this.tulipIndicators.myAO.result.result);
  if (this.AOres.length > 6){
    this.ACres.unshift(this.AOres[1] - ((this.AOres[0] + this.AOres[1]
        + this.AOres[2] + this.AOres[3] + this.AOres[4]) / 5));
  }
}

// For debugging purposes.
strat.log = function() {
  console.log(
    this.priceclose[0] + " " +
    this.AOres[0] + " " +
    this.ACres[0] + " " +
    this.RESaquire + " " +
    this.AOadvice + " " +
    this.ACadvice + " " +

  " ");
}

//
strat.check = function(candle) {

  if (this.priceclose.length > 6) {
    this.priceclose.pop();
    this.AOres.pop();
  }


  if ((this.AOres[0] > this.AOres[1])){
    this.AOadvice = 'long';
  }

  if ((this.AOres[0] < this.AOres[1])){
    this.AOadvice= 'short';
  }

  if ((this.ACres[0] > 0) && this.ACres[1] < 0){
    this.ACadvice = 'long';
  }

  if ((this.ACres[0] < 0) && this.ACres[1] > 0){
    this.ACadvice = 'short';
  }

  if ((this.AOadvice == 'short') || (this.ACadvice == 'short')){
    this.advice('short');
    this.RESaquire = 0;
  }

  if ((this.AOadvice == 'long') && (this.ACadvice == 'long')){
    this.advice('long');
    this.RESaquire = 2;
  }


  return;
}

module.exports = strat;
