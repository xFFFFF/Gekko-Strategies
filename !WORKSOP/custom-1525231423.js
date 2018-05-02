/*

  MACD - DJM 31/12/2013

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {

}

// what happens on every new candle?
var long = true;
method.update = function(candle) {
 if(long){
     long=false;
     _.defer(function() {
       this.emit('advice', {
         recommendation: 'long',
         portfolio: 100,
         candle
       });
     }.bind(this));
 }else{
    _.defer(function() {
       this.emit('advice', {
         recommendation: 'short',
         portfolio: 100,
         candle
       });
     }.bind(this));
     long=true;
 }
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {

}

method.check = function() {

}

module.exports = method;
