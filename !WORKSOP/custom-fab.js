/*

  RSI - cykedev 14/02/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

//se richiedo qualche indicatore
/*
variabili di candela:
candle.close: il prezzo di chiusura della candela
candle.high: il prezzo più alto della candela
candle.low: il prezzo più basso della candela
candle.volume: il volume degli scambi di quella candela
candle.trades: numero di scambi in quella candela
*/

/*
avvisi di vendita, acquisto:
this.advice('short'); vendere
this.advice('long'); acquistare
*/
// let's create our own method
var strat = {};


//Eseguito quando inizia la strategia di trading.
// Inizializza i parametri di trading qui.
strat.init = function() {
  this.pr = {current: 0, lastd: 100000, lastu: 0, position: "", acquisto: 0, vendita: 0};
  iniziamo = true;
  //codice
  this.su = this.settings.percentuale.su;
  this.giu = this.settings.percentuale.giu;


  //candele necessarie prima di iniziare

}

// La funzione di log viene eseguita
// quando la debugconfigurazione del flag è attiva
strat.log = function(candle) {

  }

// cosa succede ogni nuova candela
  strat.update = function(candle) {
    //codice
    if (iniziamo) {
      this.advice('long');
      console.log("inizio open true e acquisto a " + this.candle.close);
      this.pr.position ="open";
      iniziamo = false;
    }


    //inizio stop loss che insegue
    this.pr.current = parseInt(this.candle.close);
  }


// La maggior parte delle strategie richiede una quantità
// minima di storia prima che la strategia di trading
// possa essere avviata

  strat.check = function(candle) {

    //stop loss % con treno
    //se la posizione è aperta
    if (this.pr.position == "open"){
      //se prezzo corrente maggiore di precedente
      if (this.pr.current > this.pr.lastu) {
        //prezzo corrente = precedente
        this.pr.lastu = this.pr.current;
        return;
      }
      //if12 se prezzo corrente minore del prezzo precedente - %
      if (this.pr.current < (this.pr.lastu * (1 - this.giu))) { //this.pr.percent))) {
        this.advice('short'); //vendi
        this.pr.position = 'close'; //segnala posizione chiusa
        this.pr.lastu = this.pr.current; //prezzo precedente = prezzo corrente
        return;
      }
    }

    // acquista su minima percentuale di salita
    if (this.pr.position == 'close') {
      //if21 se prezzo corrente minore di precedente
      if (this.pr.current < this.pr.lastd) {
        //prezzo precedente = corrente
        this.pr.lastd = this.pr.current;
        return;
      }
      //if22 se prezzo corrente maggiore del prezzo precedente + %
      if (this.pr.current > (this.pr.lastd * (1 + this.su))) {
        this.advice('long'); //compra
        this.pr.position = 'open'; //posizione aperta
        this.pr.lastd = this.pr.current; //precedente = corrente
        return;
      }
    }
  }

module.exports = strat;
