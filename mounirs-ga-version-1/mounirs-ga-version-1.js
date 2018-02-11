//Algorithm created by @Mounir for Gekko Bot, join https://discord.gg/VNj9Nn
// npm install convnetjs  zero-fill  stats-lite numbro mathjs  cluster
var convnetjs = require('convnetjs')
var z = require('zero-fill')
var stats = require('stats-lite')
var n = require('numbro')
var math = require('mathjs')
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
var _ = require('lodash');

var log = require('../core/log.js');
// the below line starts you at 0 threads
global.forks = 0
// the below line is for calculating the last mean vs the now mean.
var oldmean = 0
getOption = function () {

  }
  
// let's create our own method
var method = {};
options = "Options Set";
options.period = "1m";
options.period_length = "1m";
options.activation_1_type = "regression";
options.neurons_1 = 5;
options.depth = 1;
options.selector = "Gdax.BTC-USD";
options.min_periods = 1000;
options.min_predict = 1;
options.momentum =0.9;
options.decay = 0.1;
options.threads = 4;
options.learns = 5;

var hasbought = false;
var stochParams = {
    optInFastKPeriod: 8,
    optInSlowKPeriod: 3,
    optInSlowDPeriod: 3
  };


neural = undefined;
// prepare everything our method needs
method.init = function() {
    this.requiredHistory = this.tradingAdvisor.historySize;
    log.debug(this.requiredHistory);

    this.addTulipIndicator('stoch', 'stoch', stochParams);

    log.debug(options);
    if (neural === undefined) {
        // Create the net the first time it is needed and NOT on every run
        neural = {
          net : new convnetjs.Net(),
          layer_defs : [
            {type:'input', out_sx:1, out_sy:1, out_depth:options.depth},
            {type:'fc', num_neurons:options.neurons_1, activation:options.activation_1_type},
            {type:'regression', num_neurons:5}
          ],
          neuralDepth: options.depth
      }
        neural.net.makeLayers(neural.layer_defs);
        neural.trainer = new convnetjs.SGDTrainer(neural.net, {learning_rate:0.01, momentum:options.momentum, batch_size:1, l2_decay:options.decay});
      }

      




}

var haspredicted = false;
var lastdvalue = 0;
var predictioncount = 0;
// what happens on every new candle?
method.update = function(candle) {


    Price.push(candle.close);
    if(Price.length > 2)
    {
        var tlp = []
        var tll = []
          
          var my_data = Price.reverse()
          var learn = function () {
              for (var i = 0; i < Price.length - 1; i++) {
                var data = my_data.slice(i, i + 1);
                var real_value = [my_data[i + 1]];
                var x = new convnetjs.Vol(data);
                neural.trainer.train(x, real_value);
                var predicted_values =neural.net.forward(x);
                predictioncount++;
                // log.debug("Real Value :",real_value);
                // log.debug("Predicted Value : ",predicted_values.w[0]);
                haspredicted = true;
              }
            }
            learn();
    }
}


method.log = function() {
 

}

method.handleposition  = function(){

}

var Price = [];

TrainIA = function(){




}
method.check = function() {
    this.stochK = this.tulipIndicators.stoch.result.sotchK;
    this.stochD = this.tulipIndicators.stoch.result.stochD; 

          //Learn
          var predict = function(data) {
            var x = new convnetjs.Vol(data);
            var predicted_value = neural.net.forward(x);
            return predicted_value.w[0];
          }
        //   if(hasbought) { 
              
        //     log.debug(lastdvalue);

        //     if(this.stochK > this.stochD )
        //     {
        //        hasbought = false;
        //        lastdvalue = 0;
        //        return this.advice('short')
   
        //     }

        //   }

          if(haspredicted & predictioncount > 1000)
          {
            var item = Price.reverse();
            prediction = predict(item)
            mean = Price[Price.length -1];
            oldmean = prediction
            meanp = math.mean(prediction, oldmean)
            // log.debug(predictioncount);
            global.meanp = meanp
            global.mean = mean
            var percentvar = (meanp-mean)/mean * 100;
                global.sig0 = global.meanp < global.mean
                if (
                   global.sig0 === false && hasbought == false 
                //    this.stochD > this.stochK && this.stochD < 20
                   )
                   {
                    //    if(result.macdHistogram <0)
                    //    {
                        // log.debug('buy at : ',this.candle.close);
                        lastdvalue = this.stochD;
                        hasbought = true;
                         return this.advice('long');
 
                    //    }
                   }
                else if
                (global.sig0 === true)
                {

                    // log.debug('sell at : ',this.candle.close);
                    hasbought = false;

                    return this.advice('short');
                }
            // }

    
  
          }



}

module.exports = method;
