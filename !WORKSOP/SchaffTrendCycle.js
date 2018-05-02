var log = require('../core/log.js');
var math = require('mathjs');

var strategy = {};

strategy.init = function() {
  this.name = 'Schaff Trend'
  this.trend = 'none';
  this.requiredHistory = this.tradingAdvisor.historySize;

  let settings = this.settings;
  settings.stcLength ? this.stcLength = settings.stcLength : this.stcLength = 10;
  settings.fastLength ? this.fastLength = settings.fastLength : this.fastLength = 23;
  settings.slowLength ? this.slowLength = settings.slowLength : this.slowLength = 50;
  settings.factor ? this.factor = settings.factor : this.factor = 0.5;

  settings.threshold_high ? this.threshold_high = settings.threshold_high : this.threshold_high = 80;
  settings.threshold_low ? this.threshold_low = settings.threshold_low : this.threshold_low = 20;
  
  const macdSettings = {
    optInFastPeriod: this.fastLength,
    optInSlowPeriod: this.slowLength,
    optInSignalPeriod: this.stcLength
  };

  this.addTulipIndicator('macd', 'macd', macdSettings);

  this.macdBuffer = [];
  this.f1Buffer = [];
  this.f2Buffer = [];
  this.pfBuffer = [];
  this.pffBuffer = [];
}

strategy.update = function(candle) {
  const macdResult = this.tulipIndicators.macd.result.macd;
  log.debug(`MACD: ${macdResult}`);
  if(!isNaN(macdResult))
  {
    this.macdBuffer.push(macdResult);
  }
  if(this.macdBuffer.length > this.stcLength)
        this.macdBuffer.shift();
}

strategy.log = function() {
  
}

// stc(length, fastLength, slowLength) => 
//     factor=input(0.5)  
//     m = macd(close,fastLength,slowLength)     
//     v1 = lowest(m, length)
//     v2 = highest(m, length) - v1    
//     f1 = (v2 > 0 ? ((m - v1) / v2) * 100 : nz(f1[1])) 
//     pf = (na(pf[1]) ? f1 : pf[1] + (factor * (f1 - pf[1]))) 
//     v3 = lowest(pf, length) 
//     v4 = highest(pf, length) - v3     
//     f2 = (v4 > 0 ? ((pf - v3) / v4) * 100 : nz(f2[1])) 
//     pff = (na(pff[1]) ? f2 : pff[1] + (factor * (f2 - pff[1])))
//     pff

strategy.check = function(candle) {
  if(this.macdBuffer.length < this.stcLength){
    return;
  }
  const price = candle.close;
  //     v1 = lowest(m, length)
  const v1 = math.min(this.macdBuffer);
  //     v2 = highest(m, length) - v1    
  const v2 = math.max(this.macdBuffer) - v1;
  //     f1 = (v2 > 0 ? ((m - v1) / v2) * 100 : nz(f1[1])) 
  const m_minus_v1 = this.macdBuffer.map(x => x-v1);
  if(v2 > 0){
    this.f1Buffer = m_minus_v1.map(x => (x/v2) * 100);
  }
  else{
    if(this.f1Buffer.length == 0)
      this.f1Buffer.push(0);
    else
      this.f1Buffer.push(this.f1Buffer[this.f1Buffer.length-1]);
  }
  //     pf = (na(pf[1]) ? f1 : pf[1] + (factor * (f1 - pf[1]))) 
  if(this.pfBuffer.length == 0)
    this.pfBuffer = this.f1Buffer;
  else{
    const previous_pf = this.pfBuffer[this.pfBuffer.length-1];
    const factor_times_f1_minus_pf_last = this.f1Buffer.map(x => (x - previous_pf) * this.factor);
    this.pfBuffer = factor_times_f1_minus_pf_last.map(x => x + previous_pf);
  }
  //     v3 = lowest(pf, length) 
  const v3 = math.min(this.pfBuffer);
  //     v4 = highest(pf, length) - v3     
  const v4 = math.max(this.pfBuffer) - v3;
  //     f2 = (v4 > 0 ? ((pf - v3) / v4) * 100 : nz(f2[1])) 
  if(v4 > 0){
    this.f2Buffer = this.pfBuffer.map(x => ((x - v3)/v4) * 100);
  }
  else{
    if(this.f1Buffer.length == 0)
      this.f2Buffer.push(0);
    else
      this.f2Buffer.push(this.f2Buffer[this.f2Buffer.length-1]);
  }
  //     pff = (na(pff[1]) ? f2 : pff[1] + (factor * (f2 - pff[1])))
  if(this.pffBuffer.length == 0){
    this.pffBuffer = this.f2Buffer;
  }
  else{
    const last_pff = this.pffBuffer[this.pffBuffer.length-1];
    this.pffBuffer = this.f2Buffer.map(x => last_pff + (this.factor * (x - last_pff)))
  }
  const result = this.pffBuffer[this.pffBuffer.length-1];
  log.debug(`Schaff Trend Cycle: ${result}`);

  if(this.f1Buffer.length > this.stcLength)
    this.f1Buffer.shift();
  if(this.f2Buffer.length > this.stcLength)
    this.f2Buffer.shift();
  if(this.pfBuffer.length > this.stcLength)
    this.pfBuffer.shift();
  if(this.pffBuffer.length > this.stcLength)
    this.pffBuffer.shift();

  if(result > this.threshold_high){
    this.trend = 'long';
    this.advice('long');
  }
  else if(result < this.threshold_low){
    this.trend = 'short';
    this.advice('short');
  }

}

module.exports = strategy;
