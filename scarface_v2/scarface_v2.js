// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies

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

var BB = require('./indicators/BB2.js'); //Bollinger Bands
var RSI = require('./indicators/RSI.js'); //RSI
var log = require('../core/log.js');
var helper = require('../helper.js')


// the below line starts you at 0 threads
global.forks = 0;

// the below line is for calculating the last mean vs the now mean.
var oldmean = 0;
var oldmeanRSI = 0;

var stop_loss = 0.07; //stop loss
var rsi_high = 70;
var rsi_low = 30;
var oversold = false;


var hasbought = false; //confirma compra!

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
options.selector = "Binance.BNB-BTC";
options.min_periods = 1000;
options.min_predict = 1;
options.momentum =0.2;
options.decay = 0.1;
options.threads = 4;
options.learns = 2;


//settings - BB
var customBBSettings = {
    TimePeriod: 20,
    NbDevUp: 2,
    NbDevDn: 2,
    persistence_upper: 10,
    persistence_lower: 10,  
    Matype:0
  };


  //EMA config 
  var customEMAShortSettings = {
    optInTimePeriod: 10 
  };

  var customEMAMediumSettings = {
    optInTimePeriod: 21   
  };

  var customEMALongSettings = {
    optInTimePeriod: 100
    //persistence: 0
  };


var stochParams = {
    optInFastKPeriod: 8,
    optInSlowKPeriod: 3,
    optInSlowDPeriod: 3
  };


neural = undefined;
neuralRSI = undefined;
// prepare everything our method needs
method.init = function() {
    this.requiredHistory = this.tradingAdvisor.historySize;
   
    //indicators
    this.addIndicator('bb', 'BB', customBBSettings); //bollinger bands
    this.addIndicator('rsi', 'RSI', {interval:6});
    this.addTulipIndicator('myEMAShort', 'ema', customEMAShortSettings);
    this.addTulipIndicator('myEMAMedium', 'ema', customEMAMediumSettings);
    this.addTulipIndicator('myEMALong', 'ema', customEMALongSettings);  


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
  if (neuralRSI === undefined) {
    // Create the net the first time it is needed and NOT on every run
    neuralRSI = {
      net : new convnetjs.Net(),
      layer_defs : [
        {type:'input', out_sx:4, out_sy:4, out_depth:options.depth},
        {type:'fc', num_neurons:options.neurons_1, activation:options.activation_1_type},
        {type:'regression', num_neurons:5}
      ],
      neuralDepth: options.depth
    }
    neuralRSI.net.makeLayers(neuralRSI.layer_defs);
    neuralRSI.trainer = new convnetjs.SGDTrainer(neuralRSI.net, {learning_rate:0.05, momentum:options.momentum, batch_size:10, l2_decay:options.decay});
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

var buyprice = 0;
var profitbuy = 0;


//Candle Heinsi Ashi
var calcHACandle = {};
var xcloseprev = 0;
var xopenprev = 0;
var result = {
    xclose: 0,
    xopen: 0,
    xhigh: 0,
    xlow: 0
};


calcHACandle = function(candle) {  

    xcloseprev = result.xclose;
    xopenprev = result.xopen;

    // Calculate new Heikin-Ashi candles
    result.xclose = (candle.open + candle.close + candle.high + candle.low)/4;
    // xOpen = [xOpen(Previous Bar) + xClose(Previous Bar)]/2
    result.xopen = (xopenprev + xcloseprev)/2;
    // xHigh = Max(High, xOpen, xClose)
    result.xhigh = math.max(candle.high, result.xopen, result.xclose);
    // xLow = Min(Low, xOpen, xClose)
    result.xlow = math.min(candle.low, result.xopen, result.xclose);

    return result;
} ; //calculo de velas



// what happens on every new candle?
method.update = function(candle) {
   
    var digits = 8;

    //Heinki-Ashi
    this.HACandle = calcHACandle(candle);
    this.HCL = (this.HACandle.xhigh + this.HACandle.xclose + this.HACandle.xopen) /3;
    
    //EMA's
    this.myEMAShort = this.tulipIndicators.myEMAShort.result.result;
    this.myEMAMedium = this.tulipIndicators.myEMAMedium.result.result;
    this.myEMALong = this.tulipIndicators.myEMALong.result.result;

    //RSI + StochRSI

   

    Price.push(this.HACandle.xclose); //price 
    RSIs.push(this.indicators.rsi.result); //rsi

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

  //console.log('prediction', prediction, mean, percentvar);
  var digits = 8;
/*
  log.debug('______________________________________');
  log.debug('calculated EMA:');
  log.debug('EMA Short:', this.myEMAShort);
  log.debug('EMA Medium:', this.myEMAMedium);
  log.debug('EMA Long:', this.myEMALong);
*/

  //log.debug('______________________________________');
  //log.debug('calculated StochRSI properties for candle:');
  //log.debug('\t', 'rsi:', this.rsi.toFixed(digits));
  //log.debug("StochRSI min:\t\t" + this.lowestRSI.toFixed(digits));
  //log.debug("StochRSI max:\t\t" + this.highestRSI.toFixed(digits));
  //log.debug("StochRSI Value:\t\t" + this.stochRSI.toFixed(2));

/*
  log.debug('______________________________________');
  log.debug('calculated BB properties for candle:');
  if (BB.upper>this.HACandle.xclose)  log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
  if (BB.middle>this.HACandle.xclose) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
  if (BB.lower>=this.HACandle.xclose) log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));
  log.debug('\t', 'Price:',this.HACandle.xclose.toFixed(digits));
  if (BB.upper<=this.HACandle.xclose)  log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
  if (BB.middle<=this.HACandle.xclose) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
  if (BB.lower<this.HACandle.xclose)   log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));
  log.debug('\t', 'Band gap: ', BB.upper.toFixed(digits) - BB.lower.toFixed(digits));
*/

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

//bollinger bands
        var BB = this.indicators.bb; 
        this.nsamples;

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
          this.HCL = (this.HACandle.xhigh + this.HACandle.xclose + this.HACandle.xopen) /3;


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

            //console.log('prediction', prediction, mean, percentvar);
            //console.log('predictionRSI', predictionRSI, lastRSI, percentvarRSI);

/*
            log.debug('______________________________________');
            log.debug('NN RSI:');
            log.debug('predictionRSI', predictionRSI);
            log.debug('lastRSI', lastRSI);
            log.debug('percentvarRSI', percentvarRSI);
*/

            global.sig0 = global.meanp < global.mean && meanp != 0
            global.sig0RSI = global.meanpRSI < global.lastRSI && meanpRSI != 0

            //check RSI
            if (this.indicators.rsi.result > rsi_high)
            {
              oversold = true; 
            }
              else oversold = false;

         
            //console.log('precentvar', percentvar,   global.sig0);
            //console.log('percentvarRSI', percentvarRSI,  global.sig0RSI);

                if ((global.sig0 === false  && percentvar > 1.70 || (global.sig0RSI === true && this.indicators.rsi.result < rsi_low) || (Price <= BB.lower)) && (hasbought===false) )
                   {
                        
                          //log.write("IA - Buy - Predicted variation: ",percentvar);
                          log.debug("IA - Buy - AT: \t\t",this.HACandle.xclose);
                          hasbought = true; //has buy!
                          meanp = 0
                          mean = 0;
                          haspredicted = false;                     
                          buyprice = this.HACandle.xclose; 
                    
                        //  ManageSize();
                          return this.advice('long');
                   }
                else if
                ( (oversold && (buyprice - this.HACandle.xclose) / buyprice > stop_loss) || ((global.sig0 === true && percentvar+0.5 < -0.90 || (global.sig0RSI === false && this.indicators.rsi.result > rsi_high) || (Price >= BB.upper)) && (hasbought)) )
                {
                      profit = (this.HACandle.xclose - buyprice)/buyprice*100;
                      log.debug("IA - Sell - At: \t",this.HACandle.xclose, 'profit:', profit.toFixed(2));
                     
                      meanp = 0
                      mean = 0;
                      hasbought = false; //has buy!
                      haspredicted = false;

                      buyprice = 0;
                      profitbuy = 0;                  
                      return this.advice('short');
                }

          }else{
            log.write('not enough predictions:', predictioncount);
          }



}

module.exports = method;
