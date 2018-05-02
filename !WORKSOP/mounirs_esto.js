// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies
// Author: https://github.com/riesgorafael 

var convnetjs = require('convnetjs')
var z = require('zero-fill')
var stats = require('stats-lite')
var n = require('numbro')
var math = require('mathjs')
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
var _ = require('lodash');

const deepqlearn = require('convnetjs/build/deepqlearn');

var log = require('../core/log.js');
// the below line starts you at 0 threads
global.forks = 0
// the below line is for calculating the last mean vs the now mean.
var oldmean = 0
var oldmeanRSI = 0
getOption = function () {

  }

// let's create our own method
var method = {}
var options = {
//neurons_1: 10,
depth: 400,
momentum: 0.4,
decay: 2.5
}

var hasbought = false;

neural = undefined;
neuralRSI = undefined;
// prepare everything our method needs
method.init = function() {
    this.requiredHistory = this.tradingAdvisor.historySize;
    this.addIndicator('rsi', 'RSI', {interval:this.settings.rsi.interval});
    //this.addIndicator('ema1', 'EMA', this.settings.ema.ema1);
    if (neural === undefined) {
        // Create the net the first time it is needed and NOT on every run
        neural = {
          net : new convnetjs.Net(),
          layer_defs : [
            {type:'input', out_sx:8, out_sy:20, out_depth:options.depth},
            {type:'fc', num_neurons:options.neurons_1, activation:'tanh'},
            {type:'regression', num_neurons:15}
          ],
          neuralDepth: options.depth
      }
        neural.net.makeLayers(neural.layer_defs);
        neural.trainer = new convnetjs.SGDTrainer(neural.net, {learning_rate:0.7, momentum:options.momentum, batch_size:10, l2_decay:options.decay});
      }
  if (neuralRSI === undefined) {
    // Create the net the first time it is needed and NOT on every run
    neuralRSI = {
      net : new convnetjs.Net(),
      layer_defs : [
        {type:'input', out_sx:8, out_sy:20, out_depth:options.depth},
        {type:'fc', num_neurons:options.neurons_1, activation:'tanh'},
        {type:'regression', num_neurons:15}
      ],
      neuralDepth: options.depth
    }
    neuralRSI.net.makeLayers(neuralRSI.layer_defs);
    neuralRSI.trainer = new convnetjs.SGDTrainer(neuralRSI.net, {learning_rate:0.7, momentum:options.momentum, batch_size:10, l2_decay:options.decay});
  }
}

var haspredicted = false;
var predictioncount = 0;
var maxaccuracy = 0;
var maxaccuracyRSI = 0;
var lowaccuracy = 0;
var lowaccuracyRSI = 0;
var highpeak =6;
var highpeakRSI =6;
var lowpeak =-100;
var lowpeakRSI =-100;

// what happens on every new candle?
method.update = function(candle) {
  console.log('update');
    log.debug('update');
    this.HCL = (this.candle.high + this.candle.close + this.candle.open) /3;
    Price.push(candle.close);
    RSIs.push(this.indicators.rsi.result);
    if(Price.length > 2)
    {
        var tlp = []
        var tll = []

          var my_data = Price;
          var learn = function () {
              for (var i = 0; i < Price.length - 1; i++) {
                var data = my_data.slice(i, i + 1);
                var real_value = [my_data[i + 1]];
                var x = new convnetjs.Vol(data);
                neural.trainer.train(x, real_value);
                var predicted_values =neural.net.forward(x);
                var accuracy = predicted_values.w[0] -real_value
                var accuracymatch = predicted_values.w[0] == real_value;
                var rewardtheybitches = neural.net.backward(accuracymatch);
                if(accuracy > 0)
                {
                  if(accuracy > maxaccuracy) {maxaccuracy = accuracy}
                }
                if(accuracy <0)
                {
                  if(accuracy < lowaccuracy) {lowaccuracy = accuracy}

                }
              }
            }
            learn();
 var my_data_RSI = RSIs;
      var learnRSI = function () {
        for (var i = 0; i < RSIs.length - 1; i++) {
          var data = my_data_RSI.slice(i, i + 1);
          var real_value = [my_data_RSI[i + 1]];
          var x = new convnetjs.Vol(data);
          neuralRSI.trainer.train(x, real_value);
          var predicted_values = neuralRSI.net.forward(x);
          var accuracyRSI = predicted_values.w[0] - real_value;
          var accuracymatch = predicted_values.w[0] == real_value;
          var rewardtheybitches = neuralRSI.net.backward(accuracymatch);
          if(accuracyRSI > 0)
          {
            if(accuracyRSI > maxaccuracyRSI) {maxaccuracyRSI = accuracyRSI}
          }
          if(accuracyRSI <0)
          {
            if(accuracyRSI < lowaccuracyRSI) {lowaccuracyRSI = accuracyRSI}

          }
        }
      }
      learnRSI();
      predictioncount++;
      haspredicted = true;
            // var json = neural.net.toJSON();
            // // the entire object is now simply string. You can save this somewhere
            // var str = JSON.stringify(json);
            // log.debug(str);

    }
}


method.log = function() {

}

method.handleposition  = function(){

}
var Price = [];
var RSIs = [];
ManageSize = function(){

      function per(num, amount){
      return num*amount/100;
      }

      var calculatedpercent = per(Price.length,5);
      Price.splice(0,calculatedpercent);

}
method.check = function() {
console.log('check');
          //Learn
          var predict = function(data) {
            var x = new convnetjs.Vol(data);
            var predicted_value = neural.net.forward(x);
            return predicted_value.w[0];
          };
  var predictRSI = function(data) {
    var x = new convnetjs.Vol(data);
    var predicted_value = neuralRSI.net.forward(x);
    return predicted_value.w[0];
  };
          this.HCL = (this.candle.high + this.candle.close + this.candle.open) /3;


          if(true || haspredicted && predictioncount > 1000)
          {
            var item = Price;
            prediction = predict(item);
            predictionRSI = predictRSI(RSIs);
            mean = Price[Price.length -1];
            lastRSI = RSIs[RSIs.length-1];
            oldmeanRSI = predictionRSI;
            oldmean = prediction;

            meanp = math.mean(prediction, mean);
            meanpRSI = math.mean(predictionRSI, lastRSI);
            global.meanpRSI = meanpRSI;
            global.meanp = meanp
            global.mean = mean
            global.lastRSI = lastRSI;

            var percentvar = (meanp-mean)/mean * 100;
            var percentvarRSI = (meanpRSI-lastRSI)/lastRSI * 100;
            if(percentvarRSI < 0) {
              //predictionRSI += lowaccuracyRSI;
              percentvarRSI += lowaccuracyRSI;
              if(lowpeakRSI > percentvarRSI) { lowpeakRSI = percentvarRSI;}
            }
            if(percentvarRSI > 0) {

              //predictionRSI -= maxaccuracyRSI;
              percentvarRSI -= maxaccuracyRSI;
              if(highpeakRSI < percentvarRSI) { highpeakRSI = percentvarRSI;}
            }
            if(percentvar < 0) {
              prediction += lowaccuracy;
              percentvar += lowaccuracy;
              if(lowpeak > percentvar) { lowpeak = percentvar;}
            }
            if(percentvar > 0) {

              prediction -= maxaccuracy;
              percentvar -= maxaccuracy;
              if(highpeak < percentvar) { highpeak = percentvar;}
            }

            console.log('prediction', prediction, mean, percentvar);
            console.log('predictionRSI', predictionRSI, lastRSI, percentvarRSI);

                global.sig0 = global.meanp < global.mean && meanp != 0
                global.sig0RSI = global.meanpRSI < global.lastRSI && meanpRSI != 0
console.log('precentvar', percentvar,   global.sig0);
console.log('percentvarRSI', percentvarRSI,  global.sig0RSI);
                if (global.sig0 === false  && percentvar > 2.0 || (global.sig0RSI === true && this.indicators.rsi.result < 15))
                   {

                          log.write("IA - Buy - Predicted variation: ",percentvar);
                          hasbought = true;
                          meanp = 0
                          mean = 0;
                          haspredicted = false;
                        //  ManageSize();
                          return this.advice('long');
                   }
                else if
                (global.sig0 === true && percentvar+0.5 < -0.90 || (global.sig0RSI === false && this.indicators.rsi.result > 80))
                {

                      log.write("IA - Sell - Predicted variation: ",percentvar);
                      meanp = 0
                      mean = 0;
                      hasbought = false;
                      haspredicted = false;
                      return this.advice('short');



                }


          }else{
            log.write('not enough predictions:', predictioncount);
          }



}

module.exports = method;
