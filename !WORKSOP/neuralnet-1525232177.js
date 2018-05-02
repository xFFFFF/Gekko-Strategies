var convnetjs = require('convnetjs');
var math = require('mathjs');


var log = require('../core/log.js');

var config = require ('../core/util.js').getConfig();


var strategy = {

  priceBuffer : [],
  predictionCount : 0,
  batchsize : 5,
  layer_neurons : 0,
  layer_activation : 'tanh',
  scale : 1,
  prevAction : 'wait',
  prevPrice : 0,
  stoplossCounter : 0,

  // init the strategy
  init : function() {

    this.name = 'Neural Network';
    this.requiredHistory = config.tradingAdvisor.historySize;

    let layers = [
      {type:'input', out_sx:1, out_sy:1, out_depth: 1},
      {type:'fc', num_neurons: this.layer_neurons, activation: this.layer_activation},
      {type:'regression', num_neurons: 1}
    ];

    this.nn = new convnetjs.Net();

    this.nn.makeLayers( layers );
    this.trainer = new convnetjs.SGDTrainer(this.nn, {
      learning_rate: this.settings.learning_rate,
      momentum: this.settings.momentum,
      batch_size: this.batchsize,
      l2_decay: this.settings.decay
    });

    this.addIndicator('stoploss', 'StopLoss', {
      threshold : this.settings.stoploss_threshold
    });


  },

  learn : function () {
    for (let i = 0; i < this.priceBuffer.length - 1; i++) {
      let data = [this.priceBuffer[i]];
      let current_price = [this.priceBuffer[i + 1]];
      let vol = new convnetjs.Vol(data);
      this.trainer.train(vol, current_price);
      let predicted_values = this.nn.forward(vol);
      let accuracymatch = predicted_values.w[0] === current_price;
      this.nn.backward(accuracymatch);
      this.predictionCount++;

    }
  },

  setNormalizeFactor : function(candle) {
    this.scale = Math.pow(10,Math.trunc(candle.high).toString().length+1);
    log.debug('Set normalization factor to',this.scale);
  },

  update : function(candle)
  {
    if (1 === this.scale && 1 < candle.high && 0 === this.predictionCount) this.setNormalizeFactor(candle);

    this.priceBuffer.push(candle.close / this.scale );
    if (2 > this.priceBuffer.length) return;

    for (i=0;i<3;++i) this.learn();

    while (this.settings.price_buffer_len < this.priceBuffer.length) this.priceBuffer.shift();
  },

  onTrade: function(event) {

    if ('buy' === event.action) {
      this.indicators.stoploss.long(event.price);
    }
    this.prevAction = event.action;
    this.prevPrice = event.price;

  },

  predictCandle : function() {
    let vol = new convnetjs.Vol(this.priceBuffer);
    let prediction = this.nn.forward(vol);
    return prediction.w[0];
  },

  check : function(candle) {
    if(this.predictionCount > this.settings.min_predictions)
    {
      if (
          'buy' === this.prevAction
          && this.settings.stoploss_enabled
          && 'stoploss' === this.indicators.stoploss.action
      ) {
        this.stoplossCounter++;
        log.debug('>>>>>>>>>> STOPLOSS triggered <<<<<<<<<<');
        this.advice('short');
      }

      let prediction = this.predictCandle() * this.scale;
      let currentPrice = candle.close;
      let meanp = math.mean(prediction, currentPrice);
      let meanAlpha = (meanp - currentPrice) / currentPrice * 100;

      let signal = meanp < currentPrice;
      if ('buy' !== this.prevAction && signal === false  && meanAlpha> this.settings.threshold_buy )
      {

        log.debug("Buy - Predicted variation: ",meanAlpha);
        return this.advice('long');
      }
      else if
      ('sell' !== this.prevAction && signal === true && meanAlpha < this.settings.threshold_sell)
      {

        log.debug("Sell - Predicted variation: ",meanAlpha);
        return this.advice('short');

      }

    }
  },

  end : function() {
    log.debug('Triggered stoploss',this.stoplossCounter,'times');
  }


};

module.exports = strategy;
