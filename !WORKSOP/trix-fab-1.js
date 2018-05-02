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
  var mytrix1Settings = this.settings.parameters1;
  this.addTulipIndicator('mytrix1', 'trix', mytrix1Settings);
}

// What happens on every new candle?
strat.update = function(candle) {

}

// For debugging purposes.
strat.log = function() {
}

//
strat.check = function(candle) {
  this.trend1 = 0.5;
  //this.historyadosc.unshift(this.tulipIndicators.myadosc.result.result);
  this.historyRTrix1_2 = this.historyRTrix1_1;
  this.historyRTrix1_1 = this.historyRTrix1_0; //setto il precedente valore trix
  this.historyRTrix1_0 = this.tulipIndicators.mytrix1.result.result;//setto l'attuale valore trix
//se trix sta salendo
  if (this.historyRTrix1_1<this.historyRTrix1_0) {
    this.trend1 = 1;//trend in salita
  }
  //se trix sta scendendo
  if (this.historyRTrix1_1>this.historyRTrix1_0) {
    this.trend1 = 0;//trend in discesa
  }


  //se il trend è in salita
  if ((this.trend1 == 1) && (this.historyRTrix1_2<this.historyRTrix1_1)){
      this.advice('long');//compro
      this.position = 'open';//apri posizione
      this.priceopen = candle.close;//ricordo il prezzo di apertura posizione
      return;
  }
  //se il trend trix è ribasso
  if ((this.trend1 == 0)){
    //e se il prezzo è salito oltre il prezzo take profit
    if (candle.close > (this.priceopen * (1 + this.settings.salvezze.takeprofit))){
      this.advice('short'); //vendi
      this.position = 'close'; //chiudo posizione
      this.priceopen = 0;
      return;
    }
  }

  // se la posizione è aperta
  if (this.position == 'open'){
    // se prezzo è minore del prezzo di acquisto meno stoploss
    if (candle.close < (this.priceopen * (1 - this.settings.salvezze.stoploss))) {
      this.advice('short'); //vendo
      this.position = 'close'; //chiudo posizione
      this.priceopen = 0;
      return;
    }
  }


  console.log(
  //  chiuso + " " +
      candle.close + " " +
  //    this.historyadosc[0] + " " +
  //    this.historytrix[0] + " " +
      this.historyRTrix1_0 + " " +
        //    macddiff + " " +
  " ");
}

module.exports = strat;
