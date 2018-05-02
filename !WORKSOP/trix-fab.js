// Let's create our own buy and sell strategy
var _ = require('lodash');
var log = require('../core/log.js');
var strat = {};


// Prepare everything our strat needs
strat.init = function() {
  this.lineare = 0;
  this.name = 'adosc-fab';
  this.requiredHistory = this.tradingAdvisor.historySize;
  this.historycdl = [];
  this.historyadosc = [];
  this.historytrix = [];
  this.historymacd = [];
  this.ultimo = 0;
  this.prezzotrend = 0;
  this.position = 'close';

//  this.trend = 'none';
  this.requiredHistory = 34;
  var myadoscSettings = this.settings.parameters1;
  var mytrix1Settings = this.settings.parameters2;
  var mytrix2Settings = this.settings.parameters3;
  var mymacdSettings = this.settings.parameters4;
  this.addTulipIndicator('myadosc', 'adosc', myadoscSettings);
  this.addTulipIndicator('mytrix1', 'trix', mytrix1Settings);
  this.addTulipIndicator('mytrix2', 'trix', mytrix2Settings);
  this.addTulipIndicator('mymacd', 'macd', mymacdSettings);
}

// What happens on every new candle?
strat.update = function(candle) {

}

// For debugging purposes.
strat.log = function() {
}

//
strat.check = function(candle) {
  this.priceacq = 0.5;
  //this.historyadosc.unshift(this.tulipIndicators.myadosc.result.result);
  this.historyRTrix1_1 = this.historyRTrix1;
  this.historyRTrix2_1 = this.historyRTrix2;
  this.historyRTrix1 = this.tulipIndicators.mytrix1.result.result;
  this.historyRTrix2 = this.tulipIndicators.mytrix2.result.result;
  var rmacd = this.tulipIndicators.mymacd.result;
  var macddiff = rmacd['macd'] - rmacd['macdSignal'];

  if ((this.historyRTrix1_1<this.historyRTrix1) && (this.historyRTrix2_1<this.historyRTrix2)) {
    this.trend1 = 1;
  }
  if ((this.historyRTrix1_1>this.historyRTrix1) && (this.historyRTrix2_1>this.historyRTrix2)) {
    this.trend1 = 0;
  }
  if (this.historyRTrix1<this.historyRTrix2) {
    this.trend2 = 1;
//    this.advice('long');
  }
  if (this.historyRTrix1>this.historyRTrix2) {
    this.trend2 = 0;
//    this.advice('short');
  }
  if ((this.trend1 == 1) && (this.trend2 == 1)){
      this.advice('long');
      this.position = 'open';
      this.priceopen = candle.close;
      return;
  }
  //se il trend dei 2 trix è ribasso
  if ((this.trend1 == 0) && (this.trend2 == 0)){
    //se il prezzo non è minimamente salito
    if (candle.close > (this.priceopen * (1 + this.settings.stoploss.stoploss))){
      this.advice('short');
      this.position = 'close';
      return;
    }
  }

  // stop loss
  // se la posizione è aperta
  if (this.position == 'open'){
    // se prezzo acquisto - stoploss è maggiore del prezzo corrente
    if (candle.close < (this.priceopen * (1 - this.settings.stoploss.stoploss))) {
      this.advice('short'); //chiudi posizione
      this.position = 'close';
      this.priceopen = 0;
      return;
    }
  }



  console.log(
  //  chiuso + " " +
      candle.close + " " +
  //    this.historyadosc[0] + " " +
  //    this.historytrix[0] + " " +
      this.historyRTrix1 + " " +
      this.historyRTrix2 + " " +
  //    macddiff + " " +
      this.trend1 + " " +
      this.trend2 + " " +
  " ");

}

module.exports = strat;
