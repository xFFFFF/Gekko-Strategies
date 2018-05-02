const MACD = require('./MACD.js');
const log = require('../../core/log');
const math = require('mathjs');

var Indicator = function(settings) {
  this.input = 'candle';

  settings.stcLength ? this.stcLength = settings.stcLength : this.stcLength = 10;
  settings.fastLength ? this.fastLength = settings.fastLength : this.fastLength = 23;
  settings.slowLength ? this.slowLength = settings.slowLength : this.slowLength = 50;
  settings.factor ? this.factor = settings.factor : this.factor = 0.5;

  const macdSettings = {
    short: this.fastLength,
    long: this.slowLength,
    signal: this.stcLength,
  };

  this.macd = new MACD(macdSettings);

  this.macdBuffer = [];
  this.f1Buffer = [];
  this.f2Buffer = [];
  this.pfBuffer = [];
  this.pffBuffer = [];
  this.result = 0;
  this.age = 0;
}

Indicator.prototype.update = function(candle) {
    const price = candle.close;
    this.updateMACD(price);
    this.age++;
    if(this.age < this.stcLength)
        return;
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
    this.result = this.pffBuffer[this.pffBuffer.length-1];
    this.previousResult = this.pffBuffer[this.pffBuffer.length-2];
    log.debug(`Schaff Trend Cycle: ${this.result}`);
    this.shiftBuffers();
}
Indicator.prototype.updateMACD = function(price){
    this.macd.update(price);
    const macdResult = this.macd.result;
    log.debug(`MACD: ${macdResult}`);
    if(!isNaN(macdResult))
    {
      this.macdBuffer.push(macdResult);
    }
}

Indicator.prototype.shiftBuffers = function(){
    //these probably don't all need to be shifted, but just to be careful
    if(this.macdBuffer && this.macdBuffer.length > this.stcLength)
        this.macdBuffer.shift();
    if(this.f1Buffer && this.f1Buffer.length > this.stcLength)
        this.f1Buffer.shift();
    if(this.f2Buffer && this.f2Buffer.length > this.stcLength)
        this.f2Buffer.shift();
    if(this.pfBuffer && this.pfBuffer.length > this.stcLength)
        this.pfBuffer.shift();
    if(this.pffBuffer && this.pffBuffer.length > this.stcLength)
        this.pffBuffer.shift();
}

module.exports = Indicator;
