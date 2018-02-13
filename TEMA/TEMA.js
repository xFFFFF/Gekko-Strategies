/*
 TEMA
 Triple EMA strategy with 'safety net'
 ---
 Uses 1x TEMA to go long/short if short trend is over TEMA.
 On top of this it uses a longer SMA as a safety net and simple
 stays out of the market if short SMA is under that SMA.
 ---
 The general idea is to buy in good market conditions and simply not
 be a part of longer downwards trends.
*/

// req's
var log = require ('../core/log.js');
var config = require ('../core/util.js').getConfig();

// strategy
var strat = {
 
 
 /* INIT */
 init: function()
 {
  // base
  this.name = 'TEMA';
  this.requiredHistory = config.tradingAdvisor.historySize;
  this.debug = false; // outputs messages, set to false to increase performance
  
  // add indicators and reset trend
  this.resetTrend();
  this.addTulipIndicator('maSlow', 'tema', { optInTimePeriod: this.settings.long });
  this.addTulipIndicator('maFast', 'sma', { optInTimePeriod: this.settings.short });
  
  // check if long SMA is to be used
  if( this.settings.SMA_long > 0 )
  {
   this.useSafety = true;
   this.addTulipIndicator('maSlowest', 'sma', { optInTimePeriod: this.settings.SMA_long });
  }
  
  // set startTime to measure execution time @ end()
  this.startTime = new Date();
  
 }, // init()
 
 
 
 /* RESET TREND */
 resetTrend: function()
 {
  var trend = {
   duration: 0,
   direction: 'none',
   longPos: false,
  };
 
  this.trend = trend;
  
 }, // resetTrend()
 
 
 
 /* CHECK */
 check: function()
 {
  // do nothing if we don't got enough history
  if( this.candle.close.length < this.requiredHistory ) return;
  
  // fetch indicators
  let ti = this.tulipIndicators;
  let maFast = ti.maFast.result.result,
   maSlow = ti.maSlow.result.result;
  
  
  // check if safety option > 0
  if( this.useSafety )
  {
   let maSlowest = ti.maSlowest.result.result;
   if( maSlow < maSlowest )
   {
    this.short();
    return; // quit
   }
  }
  
  // other rules
  if( maFast > maSlow ) { this.long(); }
  else if( maFast < maSlow ) { this.short(); }
  
 }, // check()
 
 
 
 /* LONG */
 long: function()
 {
  if( this.trend.direction !== 'up' )
  {
   this.resetTrend();
   this.trend.direction = 'up';
   this.advice('long');
  }
  
  if( this.debug )
  {
   this.trend.duration++;
   log.debug ('Positive since', this.trend.duration, 'candle(s)');
  }
 },
 
 
 
 /* SHORT */
 short: function()
 {
  if( this.trend.direction !== 'down' )
  {
   this.resetTrend();
   this.trend.direction = 'down';
   this.advice('short');
  }
  
  if( this.debug )
  {
   this.trend.duration++;
   log.debug ('Negative since', this.trend.duration, 'candle(s)');
  }
 },
 
 
 /* END */
 end: function()
 {
  let seconds = ((new Date()- this.startTime)/1000),
   minutes = seconds/60,
   str;
   
  minutes < 1 ? str = seconds + ' seconds' : str = minutes + ' minutes';
  
  log.debug('Finished in ' + str);
 }
 
}; // strat{}



/* EXPORT */
module.exports = strat;
