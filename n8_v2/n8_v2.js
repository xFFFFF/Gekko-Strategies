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
options.neurons_1 = 1;
options.depth = 4;
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
var Lowdiff = [];
var Topdiff = [];
var lowup = 0;



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
previouspred = 0;



// what happens on every new candle?
method.update = function(candle) {
    this.HCL = (this.candle.high + this.candle.close + this.candle.open) /3;
  //  if(Price.length > 1000){
  //    Price.shift()
  //  }
    Price.push(candle.close);
    if(Price.length > 2)
    {
        var tlp = []
        var tll = []

          var my_data = Price;
          var learn = function () {
              for (var i = 0; i < Price.length - 1; i++) {

                this.data = my_data.slice(i, i + 1); //previous price
                this.real_value = [my_data[i + 1]]; //this price
                this.aver = [(data[0] + real_value[0])/2]; 
                x = new convnetjs.Vol(data);
            //    y = new convnetjs.Vol(aver);
                neural.trainer.train(x, real_value);
            //    neural.trainer.train(y, x);
                this.predicted_values =neural.net.forward(x);
            //    test = [predicted_values.w[0]];

            //    y = new convnetjs.Vol(test);
            //    neural.trainer.train(y, x);
            //    this.predicted_values1 =neural.net.forward(y);
               // this.predicted_values1 =neural.net.forward(real_value);
             //   this.predicted_values2 =neural.net.forward();
                this.accuracy = predicted_values.w[0] -real_value
             //   this.accuracy = previouspred -real_value
                this.accuracymatch = predicted_values.w[0] == real_value;
                this.rewardtheybitches = neural.net.backward(accuracymatch);
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


method.log = function(candle) {
/*  if(Price.length > 4){
  console.log(' data:\t\t\t',data);
  console.log(' real value:\t\t',real_value);
  console.log(' price:\t\t\t',candle.close);
  console.log(' x:\t\t\t',x.w);
//  console.log(' y:\t\t\t',y.w);
  console.log(' predicted value:\t',predicted_values.w);
 // console.log(' predicted value1:\t',predicted_values1);
  console.log(' accuracymatch:\t\t',accuracymatch);
  console.log(' reward:\t\t\t',aver);
  console.log(' accuracy:\t\t',accuracy);
  console.log(' max accuracy:\t\t',maxaccuracy);
  console.log(' min accuracy:\t\t',lowaccuracy);
  console.log('=================================');
  }*/
}

method.handleposition  = function(){

}
var Price = [];
function per(num, amount){
    return num*amount/100;
    }

ManageSize = function(){


      var calculatedpercent = per(Price.length,6);
      Price.splice(0,calculatedpercent);

}
method.check = function(candle) {

          //Learn
          var predict = function(data) {
            var x = new convnetjs.Vol(data);
            var predicted_value = neural.net.forward(x);
          
            return predicted_value.w[0];
          }

          this.HCL = (this.candle.high + this.candle.close + this.candle.open) /3;
        //  console.log(' candle nummer:\t\t', Price.length);
        //  console.log('prediction count:\t', predictioncount);
          
          if(haspredicted & predictioncount > 1000)
          {
            var item = Price;
            prediction = predict(item)
            previouspred = prediction;
            mean = Price[Price.length -1];
           // oldmean = prediction
            meanp = math.mean(prediction, mean)
            global.meanp = meanp
            global.mean = mean
            var percentvar = (meanp-mean)/mean * 100;
            VarList.push(percentvar);
            if(VarList.length > 1000){
              VarList.shift()
            }

       /*     if(percentvar < 0) {

              prediction += lowaccuracy;
              percentvar += lowaccuracy;
              if(lowpeak > percentvar) { lowpeak = percentvar;}



            }
            if(percentvar > 0) {

              prediction -= maxaccuracy;
              percentvar -= maxaccuracy;
              if(highpeak < percentvar) { highpeak = percentvar;}
            }*/

            var VectorVar = VarList.toVector();
            var Variance =( VectorVar.variance());
            var Density30 = VectorVar.density(30);


                var top = per(Density30[Density30.length -1],-30);
                               // 1    x   1/100
                var low =(per(Density30[0],-10)) ;
               // log.debug("Variance :",Variance);
              //  console.log('top:\t', top);
              //  console.log('low:\t', low);
                
              if(percentvar > low){
                  var lowper = low - percentvar;
                  Lowdiff.push(lowper);
              }  
              if(percentvar < top){
                var topper = top - percentvar;
                Topdiff.push(topper);
            }           
                
                  if(Lowdiff.length > 20){Lowdiff.shift()}
                  if(Topdiff.length > 20){Topdiff.shift()}
                
                  lowup = math.sum(Lowdiff) / Lowdiff.length;
                  topup = math.sum(Topdiff) / Topdiff.length;


              //  console.log('topup', topup);
              //  console.log('differnce:', lowper);
              //  console.log('lowup', lowup);
               // console.log(' ');

                global.sig0 = global.meanp < global.mean && meanp != 0

                if (global.sig0 === false  && percentvar > low){
                  ManageSize();
                }
                
                if (global.sig0 === false  && percentvar > (low - lowup) && hasbought === false && candle.close > previousprice)
                   {

                          log.debug("IA - Buy - AT: \t\t",candle.close);
                        //  log.debug("Variance :",Variance);
                        //  log.debug("Density 30: low  ",low);
                          hasbought = true;
                          meanp = 0;
                          mean = 0;
                          haspredicted = false;
                          buyprice = candle.close;
                        //  ManageSize();
                          return this.advice('long');
                   }
                else if
                (global.sig0 === true && percentvar < top && hasbought === true)
                {
                      profit = (candle.close - buyprice)/buyprice*100;
                       log.debug("IA - Sell - At: \t",candle.close, 'profit:', profit.toFixed(2));
                    //   log.debug("Density 30 high : ",top);
                    //   log.debug("Variance :",Variance);
                      meanp = 0;
                      mean = 0;
                      hasbought = false;
                      haspredicted = false;
                      return this.advice('short');



                }
                previousprice = candle.close;

          }

}

module.exports = method;
