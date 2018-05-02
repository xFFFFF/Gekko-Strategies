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
var helper = require('../helper.js') //STOP LOSS
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

//settings - BB
var customBBSettings = {
    TimePeriod: 20,
    NbDevUp: 2,
    NbDevDn: 2,
    persistence_upper: 10,
    persistence_lower: 10,  
    Matype:0
  };

/*
  var customEMAshortSettings = {
    optInTimePeriod: 9,
     persistence: 0
  };

  var customEMAlongSettings = {
    optInTimePeriod: 21,
    persistence: 0
  };
*/
  
  var customSMA200Settings = {
    optInTimePeriod: 200,
  };


var customSMAshortSettings = {
    optInTimePeriod: 50  
  };


  var customSMAlongSettings = {
    optInTimePeriod: 1000,
  };
  


neural = undefined;
// prepare everything our method needs
method.init = function() {
    this.interval = this.settings.interval;
    this.nsamples = 0;
    this.requiredHistory = this.tradingAdvisor.historySize;
    this.addIndicator('bb', 'BB', customBBSettings); //bollinger bands
    this.addIndicator('rsi', 'RSI', { interval: this.interval }); //rsi   
    this.stopLoss = helper.trailingStopLoss();
    this.RSIhistory = [];

    //SMA
    this.addTulipIndicator('mySMA200', 'sma', customSMA200Settings);    
    this.addTulipIndicator('mySMAshort', 'sma', customSMAshortSettings);
    this.addTulipIndicator('mySMAlong', 'sma', customSMAlongSettings);

    this.addTulipIndicator('BULL_RSI', 'rsi', { optInTimePeriod: this.settings.BULL_RSI });
    this.addTulipIndicator('BEAR_RSI', 'rsi', { optInTimePeriod: this.settings.BEAR_RSI });

    //EMA
    //this.addTulipIndicator('myEMAshort', 'ema', customEMAshortSettings);
    //this.addTulipIndicator('myEMAlong', 'ema', customEMAlongSettings);

    
    this.trend = {
        direction: 'none',
        duration: 0,
        persisted: false,
        adviced: false
    };
    
 
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

buyprice = 0;
buytime = 0;
profitbuy = 0;
SLActive = false;

//variables BEAR-BULL
var bear_min = 100;
var bear_max = 0;
var bull_min = 100;
var bull_max = 0;


//Velas Heinsi Ashi
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

  this.rsi = this.indicators.rsi.result;
  this.RSIhistory.push(this.rsi);

  if(_.size(this.RSIhistory) > this.interval)
    // remove oldest RSI value
    this.RSIhistory.shift();

  this.lowestRSI = _.min(this.RSIhistory);
  this.highestRSI = _.max(this.RSIhistory);
  this.stochRSI = ((this.rsi - this.lowestRSI) / (this.highestRSI - this.lowestRSI)) * 100;
  
  //Heinki-Ashi
  this.HACandle = calcHACandle(candle);
  this.HCL = (this.HACandle.xhigh + this.HACandle.xclose + this.HACandle.xopen) /3; //cierre de vela

  //SMA 
  this.mySMA200 = parseFloat((this.tulipIndicators.mySMA200.result.result)).toPrecision(this.digits);
  this.mySMAshort = parseFloat((this.tulipIndicators.mySMAshort.result.result)).toPrecision(this.digits);
  this.mySMAlong = parseFloat((this.tulipIndicators.mySMAlong.result.result)).toPrecision(this.digits);
 
  //EMA 
  //this.myEMAshort = parseFloat((this.tulipIndicators.myEMAshort.result.result)).toPrecision(this.digits);
  //this.myEMAlong = parseFloat((this.tulipIndicators.myEMAlong.result.result)).toPrecision(this.digits);
 
  Price.push(this.HACandle.xclose);
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

    } // fin if(Price.length > 2)
} //fin metodo


method.log = function(candle) {

  var digits = 8;
  var BB = this.indicators.bb;

  log.debug('______________________________________');
  log.debug('calculated SMA:');
  log.debug('SMA200:', this.mySMA200);
  log.debug('SMAShort:', this.mySMAshort);
  log.debug('SMALong:', this.mySMAlong);
  //log.debug('SMA Long:', this.mySMAlong);

  //log.debug('______________________________________');
  //log.debug('calculated EMA:');
  //log.debug('EMA Short:', this.myEMAshort);
  //log.debug('EMA Long:', this.myEMAlong);
  
  log.debug('______________________________________');
  log.debug('calculated StochRSI properties for candle:');
  log.debug('\t', 'rsi:', this.rsi.toFixed(digits));
  log.debug("StochRSI min:\t\t" + this.lowestRSI.toFixed(digits));
  log.debug("StochRSI max:\t\t" + this.highestRSI.toFixed(digits));
  log.debug("StochRSI Value:\t\t" + this.stochRSI.toFixed(2));

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


  /* if(Price.length > 4){
  console.log(' data:\t\t\t',data);
  console.log(' real value:\t\t',real_value);
  console.log(' price:\t\t\t',candle.close);
  console.log(' x:\t\t\t',x.w);
  //console.log(' y:\t\t\t',y.w);
  console.log(' predicted value:\t',predicted_values.w);
  //console.log(' predicted value1:\t',predicted_values1);
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

        //bollinger bands
        var BB = this.indicators.bb; 
        this.nsamples;

        var StochRSIsaysBUY = this.stochRSI < 20;
        var StochRSIsaysSELL = this.stochRSI >= 80;
         
        //console.log('check');
        //if (Price >= BB.upper); //vende
        //if ((Price < BB.upper) && (Price >= BB.middle)); 
        //if ((Price > BB.lower) && (Price < BB.middle));
        //if (Price <= BB.lower); //compra

        //var lastPrice = this.HACandle.xclose; //ultimo precio de vela

           
          //Learn
          var predict = function(data) {
            var x = new convnetjs.Vol(data);
            var predicted_value = neural.net.forward(x);
          
            return predicted_value.w[0];
          }

      this.HCL = (this.HACandle.xhigh + this.HACandle.xclose + this.HACandle.xopen) /3;
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

               if (hasbought===true) 
                {   buytime ++;
                    profitbuy = (this.HACandle.xclose - buyprice)/buyprice*100;
                }
                if (this.indicators.rsi.result < this.settings.thresholds.low)
                {
                    oversold = true;
                }
                else oversold = false;
                if (hasbought){
                 log.debug('______________________________________');
                 log.debug('calculated STOP LOSS ');
                 log.debug("profitbuy:",profitbuy);
                 log.debug("rsi:  ",this.rsi);
                 log.debug("buyprice:  ",buyprice);
                 log.debug("current:",this.HACandle.xclose);                                  
                }
         
                // if(this.stopLoss.active() && hasbought===true) {
              //** Linea Reemplazada **// //if (this.stopLoss.triggered(this.HACandle.xclose)||(buyprice - this.HACandle.xclose) / buyprice > 0.03) {
                      if ((buyprice - this.HACandle.xclose) / buyprice > (this.settings.SL/100)) {
                        this.SLActive == true;
                    } else {
                        this.stopLoss.update(this.HACandle.xclose);
                    }
                //}

                if (global.sig0 === false  && percentvar > low){
                  ManageSize();
                }
                
                if (((global.sig0 === false  && percentvar > (low - lowup) && (hasbought === false) && (this.HACandle.xclose > previousprice))) || (hasbought===false && this.indicators.rsi.result < this.settings.thresholds.low && StochRSIsaysBUY) || (Price <= BB.lower) ) 
                   {
                         log.debug("IA - Buy - AT: \t\t",this.HACandle.xclose);
                        //  log.debug("Variance :",Variance);
                        //  log.debug("Density 30: low  ",low);                       
                          hasbought = true;
                          meanp = 0;
                          mean = 0;
                          haspredicted = false;
                          buyprice = this.HACandle.xclose;
                          this.stopLoss.create(this.settings.SL, buyprice);
                        //  ManageSize();
                          return this.advice('long');
                   }
                else if
                 ((oversold === true && this.SLActive && buytime > this.settings.thresholds.low && hasbought===true) || (global.sig0 === true && percentvar < top && hasbought === true) || ((hasbought===true && this.indicators.rsi.result > this.settings.thresholds.high && StochRSIsaysSELL) && this.SLActive) || (Price >= BB.upper) )   
                {                                                                                                                                                                                                                                                                                                                           
                      profit = (this.HACandle.xclose - buyprice)/buyprice*100;
                      log.debug("IA - Sell - At: \t",this.HACandle.xclose, 'profit:', profit.toFixed(2));
                      //   log.debug("Density 30 high : ",top);
                    //   log.debug("Variance :",Variance);
                      meanp = 0;
                      mean = 0;
                      hasbought = false;
                      haspredicted = false;
                      haspredicted = false;
                      buytime=0;
                      buyprice=0;
                      profitbuy=0;
                      this.stopLoss.destroy();
                      this.SLActive == false;                    
                      return this.advice('short');
                } 
                previousprice = this.HACandle.xclose;                          
                          
          }
};


module.exports = method;


