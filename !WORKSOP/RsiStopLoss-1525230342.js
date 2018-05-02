// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies
// Source: https://raw.githubusercontent.com/RevREB/gekko-estrategias/stable/strategies/RsiStopLoss.js
/*

  RSI - cykedev 14/02/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var RSI = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function () {
  this.name = 'RsiStopLoss';

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false,
  };
  this.stop = {};
  this.stop = {
    stop: 5,
    gain: 5,
    progressive: true,
    progressiveGain: 2,
    persisted: false,
    duration: 0,
    buy: false,
    buyValue: 0,
    stopValue: 0,
    gainValue: 0,

  }

  if(this.settings && this.settings.stoploss)
  this.stop = Object.assign(this.stop,this.settings.stoploss)

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', this.settings);
}

// for debugging purposes log the last
// calculated parameters.
method.log = function (candle) {
  // var digits = 8;
  // var rsi = this.indicators.rsi;

  // log.debug('calculated RSI properties for candle:');
  // log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function (candle) {
  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;
  var digits = 8;
  candleExample = {
    id: 99039,
    start: "2018-01-03T14:43:00.000",
    open: 15000.00000009,
    high: 15070,
    low: 14770,
    close: 14887.99999971,
    vwp: 14886.873751966494,
    volume: 338.5315601699998,
    trades: 2580
  }

  //log.debug('Novo candle', rsi.lastClose.toFixed(digits), rsiVal)

  if (rsiVal > this.settings.thresholds.high) { // Venda

    if (!this.stop.buy) {
      // new trend detected
      if (this.trend.direction !== 'high')
        this.trend = {
          duration: 0,
          persisted: false,
          direction: 'high',
          adviced: false
        };

      this.trend.duration++;

      log.debug('In high since', this.trend.duration, 'candle(s)');

      if (this.trend.duration >= this.settings.thresholds.persistence)
        this.trend.persisted = true;

      // if (this.trend.persisted && !this.trend.adviced) {
      //   this.trend.adviced = true;
      //   this.stop.buy = false;
      //   this.advice('short');
      //   log.debug('short a => ', candle.vwp.toFixed(digits))
      // } else
      this.advice();
    } else {
      this.advice();
    }

  } else if (rsiVal < this.settings.thresholds.low) { // Compra
    if (!this.stop.buy) {
      // new trend detected
      if (this.trend.direction !== 'low')
        this.trend = {
          duration: 0,
          persisted: false,
          direction: 'low',
          adviced: false
        };

      this.trend.duration++;

      log.debug('In low since', this.trend.duration, 'candle(s)');

      if (this.trend.duration >= this.settings.thresholds.persistence)
        this.trend.persisted = true;

      if (this.trend.persisted && !this.trend.adviced) {
        this.trend.adviced = true;
        this.advice('long');
        log.debug('Compra - long a => ', candle.close.toFixed(digits))
        this.stop.buy = true;
        this.stop.buyValue = candle.close;
        this.stop.stopValue = this.stop.buyValue - (this.stop.buyValue * (this.stop.stop / 100));
        this.stop.gainValue = this.stop.buyValue + (this.stop.buyValue * (this.stop.gain / 100));
        log.debug('Limit STOP: ', this.stop.stopValue.toFixed(digits), 'GAIN: ', this.stop.gainValue.toFixed(digits))
      } else
        this.advice();
      }
      else{
        this.advice();
    }

  } else { // proteção com stop loss e gain (progressivo)

    //   this.stop.stopValue = this.stop.buyValue - (this.stop.buyValue * (this.stop.stop / 100));
    // this.stop.gainValue = this.stop.buyValue + (this.stop.buyValue * (this.stop.gain / 100));

    if (this.stop.buy) { //Se estou comprado

      if (this.candle.close <= this.stop.stopValue) { //Venda atingiu o stop
        this.trend.adviced = true;
        this.stop.buy = false;
        this.advice('short');
        log.debug('Venda através do stop(LOW) => ', candle.vwp.toFixed(digits))
      } else if (this.candle.close > this.stop.gainValue) { //Se o candle atingiu o topo

        if (this.stop.progressiveGain) { //Se o stop é progressivo
          //Atualiza o valor de compra de acordo com o ganho progressivo
          this.stop.buyValue = this.stop.buyValue + (this.stop.buyValue * (this.stop.progressiveGain / 100));
          // e recalcula os novos limits de stop e gain
          this.stop.stopValue = this.stop.buyValue - (this.stop.buyValue * (this.stop.stop / 100));
          this.stop.gainValue = this.stop.buyValue + (this.stop.buyValue * (this.stop.gain / 100));
          this.advice();
          log.debug('Recalculado o novo limit STOP: ', this.stop.stopValue.toFixed(digits), 'GAIN: ', this.stop.gainValue.toFixed(digits))
        } else { // Se não for progressivo - Venda com o ganho atingido
          this.trend.adviced = true;
          this.stop.buy = false;
          this.advice('short');
          log.debug('Venda através do stop(GAIN) => ', candle.vwp.toFixed(digits))
        }

      }




      //log.debug(this.stop);

    } else {
      this.advice();
    }
  }
}

module.teste = function () {
  //Na estratégia init, crie a variável stoploss: 
  this.stop = "";

  // if (logic that determines a sell || this.stop != "" && price < this.stop) {

  //   // se você quiser mostrar uma parada que está sendo acionada no console: 
  //   if (this.stop != "" && price < this.stop) {
  //     console.log("stoplosss triggered - " + this.stop);
  //   }

  //   this.direction = "short";
  //   if (this.trend == "long") {
  //     this.stop = "";
  //     this.trend = this.direction;
  //     this.advice(this.direction);
  //   }

  // } else if (logic that determines a buy) {
  //   if (this.stop == "") {
  //     // configura o stoploss, você deve fazer o .2 uma variável na configuração de estratégia realmente 
  //     this.stop = price - (price * .2);
  //     this.direction = "long";
  //     this.trend = this.direction;
  //     this.advice(this.direction);
  //   }
  // }

}



module.exports = method;
