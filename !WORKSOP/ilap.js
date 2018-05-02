// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

var log = require('../core/log');

// Let's create our own strat
var strat = {};

const LONG = 0
const SHORT = 1

// Prepare everything our method needs
strat.init = function() {
  this.position = ['long', 'short']
  this.input = 'candle';
  this.currentTrend = 'long';
  this.requiredHistory = 55;

  this.addTalibIndicator('atr', 'atr', { optInTimePeriod: 39})
  this.addTalibIndicator('natr', 'natr', { optInTimePeriod: 39})

  this.addTalibIndicator('entry_long', 'max', { optInTimePeriod: 20})
  this.addTalibIndicator('failsafe_long', 'max', { optInTimePeriod: 55})
  this.addTalibIndicator('exit_long', 'min', { optInTimePeriod: 10})

  this.addTalibIndicator('entry_short', 'min', { optInTimePeriod: 20})
  this.addTalibIndicator('failsafe_short', 'min', { optInTimePeriod: 55})
  this.addTalibIndicator('exit_short', 'max', { optInTimePeriod: 10})
  
  this.atr = 0.0
  this.natr = 0.0
  this.entry = [ -1, -1 ]
  this.failsafe_entry = [ -1, -1 ]
  this.exit = [-1,-1]
  this.stop = [-1,-1]

}

// What happens on every new candle?
strat.update = function(candle) {
  log.debug('#ILAP STRAT ON UPDATE: Strategy log');
}


strat.log = function() {
  log.debug('#ILAP STRAT ON LOG: Strategy log');
}

strat.check = function(candle) {
  log.debug('######## CHECK IS CALLED.........');

  this.atr = this.talibIndicators.atr.result
  this.natr = this.talibIndicators.natr.result

  this.entry[LONG]          = this.talibIndicators.entry_long.result
  this.failsafe_entry[LONG] = this.talibIndicators.failsafe_long.result
  this.exit[LONG]           = this.talibIndicators.exit_long.result

  this.entry[SHORT]          = this.talibIndicators.entry_short.result
  this.failsafe_entry[SHORT] = this.talibIndicators.failsafe_short.result
  this.exit[SHORT]           = this.talibIndicators.exit_short.result

  var entry = [false, false]
  var exit  = [false, false]
  var stop_loss  = [0, 0]

  entry[LONG] = this.entry[LONG] > candle.high
  exit[LONG]  = this.exit[LONG] <  candle.low
  stop_loss[LONG]  = candle.high - 2 * this.atr.outReal

  entry[SHORT] = this.entry[SHORT] < candle.low
  exit[SHORT]  = this.entry[SHORT] <  candle.high
  stop_loss[SHORT]  = candle.low + 2 * this.atr.outReal
  
  // Entry a long position
  //TODO: Does not implemented yet
  // Entry a short position 
  entry[SHORT] = true
  //           What            position              name of position, signal(t/f), stop_loss
  this.advice('entry', candle, this.position[SHORT], entry[SHORT], stop_loss[SHORT])
  //this.advice('exit',  candle, this.position[SHORT], exit[SHORT])
  return

  const util = require('util')

  log.debug('CANDLE: ' + util.inspect(candle, false, null))
  log.debug('ATR: '  + util.inspect(atr, false, null))
  log.debug('NATR: ' + util.inspect(natr, false, null))
  log.debug('ENTY: ' + util.inspect(entry_long, false, null))
  log.debug('FAILSAFE: ' + util.inspect(failsafe_long, false, null))
  log.debug('EXIT: ' + util.inspect(exit_long, false, null))

  // Only continue if we have a new update.
  if(!this.toUpdate) {
    log.debug('#ON CHECK: Not to Update')
    return;
  }
}

module.exports = strat;