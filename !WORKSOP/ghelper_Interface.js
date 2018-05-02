// helpers
var _ = require('lodash');
const request = require('request');
var log = require('../core/log.js');

// let's create our own method
var method = {

  // prepare everything our method needs
  init: function() {
    this.name = 'ghelper';
    this.url = "http://127.0.0.1:3030/data"


    this.requiredHistory = this.tradingAdvisor.historySize;

    // define the indicators we need
    this.addIndicator('sma', 'SMA', this.settings.weight);
    this.addTulipIndicator('ROC', 'roc', {
      optInTimePeriod: 10
    })
  },

  // what happens on every new candle?
  update: function(candle) {
    roc = this.tulipIndicators.ROC.result.result;
    normRoc = (roc / ((candle.close + candle.open + candle.high + candle.low) / 4)) * 100;


    var sendData = {
      "Asset": this.settings.Asset,
      "Currency": this.settings.Currency,
      "Rating": normRoc
    }
    let advice = null;

    request.post(
      'http://127.0.0.1:3030/data', {
        json: {
          "Asset": this.settings.Asset,
          "Currency": this.settings.Currency,
          "Rating": normRoc
        }
      },

      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body)
          advice = body.advice;
        }
      });

    if (advice === 'sell') {
      this.short();
    } else if (advice === 'buy') {
      this.long();
    }
    // console.log("Data = " + JSON.stringify(sendData))

    // nothing!
  },

  short: function() {
    this.advice('short');
  },

  long: function() {
    this.advice('long');
  },

  // for debugging purposes: log the last calculated
  // EMAs and diff.
  log: function() {
    // let sma = this.indicators.sma;
    // log.debug('\t SMA:', sma.result.toFixed(5));

  },

  check: function(candle) {
    // let sma = this.indicators.sma;
    // let price = candle.close;

  },

};

module.exports = method;