/*
    RSI Bull and Bear
    Use different RSI-strategies depending on a longer trend
<<<<<<< HEAD
    3 feb 2017
=======
>>>>>>> origin/stable
    
    (CC-BY-SA 4.0) Tommie Hansen
    https://creativecommons.org/licenses/by-sa/4.0/
*/

<<<<<<< HEAD
// req's
var log = require ('../core/log.js');
var config = require ('../core/util.js').getConfig();

// strategy
var strat = {
    
    /* INIT */
    init: function()
    {
        this.name = 'RSI Bull and Bear';
        this.requiredHistory = config.tradingAdvisor.historySize;
        this.resetTrend();
        
        // debug? set to flase to disable all logging (improves performance)
        this.debug = true;
        
        // add indicators
        this.addTulipIndicator('maSlow', 'sma', { optInTimePeriod: this.settings.SMA_long });
        this.addTulipIndicator('maFast', 'sma', { optInTimePeriod: this.settings.SMA_short });
        this.addTulipIndicator('BULL_RSI', 'rsi', { optInTimePeriod: this.settings.BULL_RSI });
        this.addTulipIndicator('BEAR_RSI', 'rsi', { optInTimePeriod: this.settings.BEAR_RSI });
        
        // debug stuff
        this.startTime = new Date();
        this.stat = {
            bear: { min: 100, max: 0 },
            bull: { min: 100, max: 0 }
        };
        
        
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
    },
    
    /* get lowest/highest for backtest-period */
    lowHigh: function( rsi, type )
    {
        let cur;
        if( type == 'bear' ) {
            cur = this.stat.bear;
            if( rsi < cur.min ) this.stat.bear.min = rsi; // set new
            if( rsi > cur.max ) this.stat.bear.max = rsi;
        }
        else {
            cur = this.stat.bull;
            if( rsi < cur.min ) this.stat.bull.min = rsi; // set new
            if( rsi > cur.max ) this.stat.bull.max = rsi;
        }
    },
    
    
    /* CHECK */
    check: function()
    {
        if( this.candle.close.length < this.requiredHistory ) { return; } // check if candle length is correct
        
        // get all indicators
        let ind = this.tulipIndicators,
            maSlow = ind.maSlow.result.result,
            maFast = ind.maFast.result.result,
            rsi;
            
        // BEAR TREND
        if( maFast < maSlow )
        {
            rsi = ind.BEAR_RSI.result.result;
            if( rsi > this.settings.BEAR_RSI_high ) this.short();
            else if( rsi < this.settings.BEAR_RSI_low ) this.long();
            
            if(this.debug) this.lowHigh( rsi, 'bear' );
            //log.debug('BEAR-trend');
        }

        // BULL TREND
        else
        {
            rsi = ind.BULL_RSI.result.result;
            if( rsi > this.settings.BULL_RSI_high ) this.short();
            else if( rsi < this.settings.BULL_RSI_low )  this.long();
            if(this.debug) this.lowHigh( rsi, 'bull' );
            //log.debug('BULL-trend');
        }
    
    }, // check()
    
    
    /* LONG */
    long: function()
    {
        if( this.trend.direction !== 'up' ) // new trend? (only act on new trends)
        {
            this.resetTrend();
            this.trend.direction = 'up';
            this.advice('long');
            //log.debug('go long');
        }
        
        if(this.debug)
        {
            this.trend.duration++;
            log.debug ('Long since', this.trend.duration, 'candle(s)');
        }
    },
    
    
    /* SHORT */
    short: function()
    {
        // new trend? (else do things)
        if( this.trend.direction !== 'down' )
        {
            this.resetTrend();
            this.trend.direction = 'down';
            this.advice('short');
        }
        
        if(this.debug)
        {
            this.trend.duration++;
            log.debug ('Short since', this.trend.duration, 'candle(s)');
        }
    },
    
    
    /* END backtest */
    end: function(){
        
        let seconds = ((new Date()- this.startTime)/1000),
            minutes = seconds/60,
            str;
            
        minutes < 1 ? str = seconds + ' seconds' : str = minutes + ' minutes';
        
        log.debug('Finished in ' + str);
        
        if(this.debug)
        {
            let stat = this.stat;
            log.debug('RSI low/high for period:');
            log.debug('BEAR low/high: ' + stat.bear.min + ' / ' + stat.bear.max);
            log.debug('BULL low/high: ' + stat.bull.min + ' / ' + stat.bull.max);
        }
    }
    
};

module.exports = strat;
=======
var _ = require ('lodash');
var log = require ('../core/log.js');

// Configuration
var config = require ('../core/util.js').getConfig();
var async = require ('async');

// Let's create our own method
var method = {};


// Prepare everything our method needs
method.init = function () {

   this.name = 'RSI Bull and Bear';

   // Keep state about stuff
   this.trend = {
       direction: 'none',
       duration: 0,
       persisted: false,
       adviced: false
   };

   // How many candles do we need as a base before start giving advice
   this.requiredHistory = config.tradingAdvisor.historySize;
    
    // add indicators
    this.addTulipIndicator('maSlow', 'sma', { optInTimePeriod: this.settings.SMA_long });
    this.addTulipIndicator('maFast', 'sma', { optInTimePeriod: this.settings.SMA_short });
    
    this.addTulipIndicator('BULL_RSI', 'rsi', { optInTimePeriod: this.settings.BULL_RSI });
    this.addTulipIndicator('BEAR_RSI', 'rsi', { optInTimePeriod: this.settings.BEAR_RSI });
 
}

// What happens on every new candle?
method.update = function(candle) {} // do nothing
method.log = function() {} // do nothing

method.check = function (candle)
{
   if( candle.close.length < this.requiredHistory ) { return; } // TODO: still needed?!
    
    // get all indicators
    let ind = this.tulipIndicators;
    
    let maSlow = ind.maSlow.result.result,
        maFast = ind.maFast.result.result,
        rsi;
    
    
    // define rules
    let goLong = false,
        goShort = false;
        
    // BEAR TREND
    if( maFast < maSlow )
    {
        log.debug('BEAR Trend');
        rsi = ind.BEAR_RSI.result.result;
        if( rsi > this.settings.BEAR_RSI_high ) goShort = true;
        if( rsi < this.settings.BEAR_RSI_low )  goLong = true;
    }
    
    // BULL TREND
    else
    {
        log.debug('BULL Trend');
        rsi = ind.BULL_RSI.result.result;
        if( rsi > this.settings.BULL_RSI_high ) goShort = true;
        if( rsi < this.settings.BULL_RSI_low )  goLong = true;
    }

    // LONG
    if( goLong )
    {
        
        // new trend? (only act on new trends)
        if (this.trend.direction !== 'up')
        {
            
            // reset the state for the new trend
            this.trend = {
                duration: 0,
                persisted: false,
                direction: 'up',
                adviced: false
            };
            
            
            if( !this.trend.adviced )
            {
                this.trend.adviced = true;
                this.advice('long');
            }
            else {
                this.advice();
            }
            
        }

        this.trend.duration ++;
        log.debug ('Positive since ', this.trend.duration, 'candle (s)');
        
    }
    
    // SHORT
    else if( goShort )
    {
        
        // new trend? (else do things)
        if( this.trend.direction !== 'down' )
        {
            
            // reset state
            this.trend = {
                duration: 0,
                persisted: false,
                direction: 'down',
                adviced: false
            };

            if( !this.trend.adviced )
            {
                this.trend.adviced = true;
                this.advice ('short');
            }
            else {
                this.advice();
            }
        
        }
        
        this.trend.duration ++;
        log.debug ('Negative since ', this.trend.duration, 'candle (s)');
        
    }
    
    // default
    else
    {
        //log.debug('No trend');
        this.advice();
    }
   
} // method.check()

module.exports = method;
>>>>>>> origin/stable
