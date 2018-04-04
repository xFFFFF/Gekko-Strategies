// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies
// Source: https://justhodl.blogspot.com/

var convnetjs = require('convnetjs')
var z = require('zero-fill')
var stats = require('stats-lite')
var n = require('numbro')
var math = require('mathjs')
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
var _ = require('lodash');
var gauss = require('gauss');

const deepqlearn = require('convnetjs/build/deepqlearn');

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
options.neurons_1 = 25;
options.depth = 1;
options.selector = "Gdax.BTC-USD";
options.min_periods = 1500;
options.min_predict = 1;
options.momentum =0.2;
options.decay = 0.1;
options.threads = 4;
options.learns = 2;
/*
[myStoch]
highThreshold = 80
lowThreshold = 20
optInFastKPeriod = 14
optInSlowKPeriod = 5
optInSlowDPeriod = 5

[myLongEma]
optInTimePeriod = 100

[myShortEma]
optInTimePeriod = 50

[stopLoss]
percent = 0.9*/

var hasbought = false;
var stochParams = {
    optInFastKPeriod: 8,
    optInSlowKPeriod: 3,
    optInSlowDPeriod: 3
  };

var VarList = new gauss.Collection();

neural = undefined;
// prepare everything our method needs
method.init = function() {
    this.requiredHistory = this.tradingAdvisor.historySize;


    if (neural === undefined) {
        // Create the net the first time it is needed and NOT on every run
        neural = {
          net : new convnetjs.Net(),
          layer_defs : [
            {type:'input', out_sx:4, out_sy:4, out_depth:options.depth},
            {type:'fc', num_neurons:options.neurons_1, activation:options.activation_1_type},
            {type:'regression', num_neurons:5}
          ],
          neuralDepth: options.depth
      }
        neural.net.makeLayers(neural.layer_defs);
        neural.trainer = new convnetjs.SGDTrainer(neural.net, {learning_rate:0.05, momentum:options.momentum, batch_size:10, l2_decay:options.decay});
      }






}



var haspredicted = false;
var predictioncount = 0;
var maxaccuracy = 0;
var lowaccuracy = 0;
var highpeak =6;
var lowpeak =-100;

// what happens on every new candle?
method.update = function(candle) {
    this.HCL = (this.candle.high + this.candle.close + this.candle.open) /3;
    Price.push(candle.close);
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
                predictioncount++;
                haspredicted = true;

              }
            }
            learn();

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
function per(num, amount){
    return num*amount/100;
    }

ManageSize = function(){


      var calculatedpercent = per(Price.length,5);
      Price.splice(0,calculatedpercent);

}
method.check = function() {

          //Learn
          var predict = function(data) {
            var x = new convnetjs.Vol(data);
            var predicted_value = neural.net.forward(x);
            return predicted_value.w[0];
          }

          this.HCL = (this.candle.high + this.candle.close + this.candle.open) /3;


          if(haspredicted & predictioncount > 1000)
          {
            var item = Price;
            prediction = predict(item)
            mean = Price[Price.length -1];
            oldmean = prediction
            meanp = math.mean(prediction, mean)
            global.meanp = meanp
            global.mean = mean
            var percentvar = (meanp-mean)/mean * 100;
            VarList.push(percentvar);

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

            var VectorVar = VarList.toVector();
            var Variance =( VectorVar.variance());
            var Density30 = VectorVar.density(30);


                var top = per(Density30[Density30.length -1],-30);
                var low =  per(Density30[0],10);



                global.sig0 = global.meanp < global.mean && meanp != 0
                if (global.sig0 === false  && percentvar > low)
                   {

                          log.debug("IA - Buy - Predicted variation: ",percentvar);
                          log.debug("Variance :",Variance);
                          log.debug("Density 30: low  ",low);
                          hasbought = true;
                          meanp = 0;
                          mean = 0;
                          haspredicted = false;
                          ManageSize();
                          return this.advice('long');
                   }
                else if
                (global.sig0 === true && percentvar < top)
                {

                    //   log.debug("IA - Sell - Predicted variation: ",percentvar);
                    //   log.debug("Density 30 high : ",top);
                    //   log.debug("Variance :",Variance);
                      meanp = 0;
                      mean = 0;
                      hasbought = false;
                      haspredicted = false;
                      return this.advice('short');



                }

          }



}

module.exports = method;
