// Let's create our own buy and sell strategy
var strat = {};

// Prepare everything our strat needs
strat.init = function() {
  this.priceclose = []; //array dei prezzi
  this.AOres = []; //array cointenente lo storico di AO
  this.AOtendenza = 'discesa'; //array che controlla i risultati per gli acquisti
  this.AOcorrente = 'normale';
  this.posizione = 'chiusa';
  this.openprice = 0;
  this.stoploss = 0.98;
  this.takeprofit = 0;
  this.name = 'tulip-AO'
//  this.trend = 'none';
//  this.requiredHistory = 10;
  this.addTulipIndicator('myAO', 'ao', "");
  return;
}

// What happens on every new candle?
strat.update = function(candle) {
  this.priceclose.unshift(candle.close);
  this.AOres.unshift(this.tulipIndicators.myAO.result.result);
  if (this.priceclose.length > 34){
    this.priceclose.pop();
    this.AOres.pop();
  }
  return;
}

// For debugging purposes.
strat.log = function() {
}

//
strat.check = function(candle) {
  //stop loss
  if ((this.posizione == 'aperta') && (candle.close < (this.openprice*this.stoploss))) {
    this.advice('short'); //vendo
    this.posizione = 'chiusa';
    return;
  }
//rilevamento inversione di AO
  if ((this.AOres[0] > this.AOres[1]) && (this.AOres[1] > this.AOres[2])) {
    this.AOcorrente = "inversione";
  } else {this.AOcorrente = 'normale';}

  if ((this.AOres[0] < this.AOres[1]) && (this.AOres[1] < this.AOres[2])) {
    this.AOcorrente = "inversione";
  } else {this.AOcorrente = 'normale';}


  //rilevamento del trend di salita
  //se le ultime 3 candele sono sempre maggiori rispetto a quelle precedenti
  if ((this.AOres[2]>this.AOres[3]) && (this.AOres[3]>this.AOres[4])) { //&& (this.AOres[4]>this.AOres[5])){
    this.AOtrend = 'salita';
  }
  //rilevamento del trend di discesa
  //se le ultime 3 candele sono sempre minori rispetto a quelle precedenti
  else if ((this.AOres[2]<this.AOres[3]) && (this.AOres[3]<this.AOres[4])) { // && (this.AOres[4]<this.AOres[5])){
    this.AOtrend = 'discesa';
  } else this.AOtrend = 'niente';


  //se trend AO in discesa, c'è un inversione e la posizione è chiusa
  if (this.AOcorrente == 'inversione'){// in caso di indecisione di mercato
    if ((this.AOtrend == 'niente') && (this.posizione == 'aperta')) {
      this.advice('short'); //vendo
      this.posizione = 'chiusa';
      return;
    }
    if ((this.AOtrend == "discesa") && (this.posizione == 'chiusa')) {
      this.advice('long'); //compro
      this.posizione = 'aperta';
      this.openprice = candle.close;
      return;
  }
  //se trend AO in salita, c'è un inversione e la posizione è aperta
    if ((this.AOtrend == "salita") && (this.posizione == 'aperta')) {
      if (candle.close > (this.takeprofit*0.9802)){
        this.advice('short'); //vendo
        this.posizione = 'chiusa';
        return;
      }
    }
  }


  console.log(
//    this.priceclose + " " +
    //this.AOres + " " +
  " ");
  return;
}

module.exports = strat;
