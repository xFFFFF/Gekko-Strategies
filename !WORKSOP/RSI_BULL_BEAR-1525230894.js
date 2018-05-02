/*
    RSI Bull and Bear + ADX modifier
    1. Use different RSI-strategies depending on a longer trend
    2. But modify this slighly if shorter BULL/BEAR is detected
    -
    8 feb 2017
    -
    (CC-BY-SA 4.0) Tommie Hansen
    https://creativecommons.org/licenses/by-sa/4.0/
*/

// req's
var log = require ('../core/log.js');
var config = require ('../core/util.js').getConfig();

// strategy
var strat = {
    
    /* INIT */
    init: function()
    {
        this.name = 'RSI Bull and Bear + ADX';
        this.requiredHistory = config.tradingAdvisor.historySize;
        this.resetTrend();        
        
        // debug? set to flase to disable all logging/messages/stats (improves performance)
        this.debug = false;
        
        // performance
        config.backtest.batchSize = 1000; // increase performance
        config.silent = true;
        config.debug = false;
        
        /* TEMP: set params */
        this.settings.SMA_long = 1000;
        this.settings.SMA_short = 50;
        
        this.settings.BULL_RSI = 10; // timeperiod
        this.settings.BULL_RSI_high = 80;
        this.settings.BULL_RSI_low = 60;
        
        this.settings.BEAR_RSI = 15; // timeperiod
        this.settings.BEAR_RSI_high = 60;
        this.settings.BEAR_RSI_low = 20;
        
        this.settings.ADX = 3; // timeperiod
        this.settings.ADX_high = 70;
        this.settings.ADX_low = 50;
        
        // SMA
        this.addTulipIndicator('maSlow', 'sma', { optInTimePeriod: this.settings.SMA_long });
        this.addTulipIndicator('maFast', 'sma', { optInTimePeriod: this.settings.SMA_short });
        
        // RSI
        this.addTulipIndicator('BULL_RSI', 'rsi', { optInTimePeriod: this.settings.BULL_RSI });
        this.addTulipIndicator('BEAR_RSI', 'rsi', { optInTimePeriod: this.settings.BEAR_RSI });
        
        // ADX
        this.addTulipIndicator('ADX', 'adx', { optInTimePeriod: this.settings.ADX })
        this.adx = { max: 0, min: 0 };
        
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
    
    
    /* get low/high for backtest-period */
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
        
        // get all indicators
        let ind = this.tulipIndicators,
            maSlow = ind.maSlow.result.result,
            maFast = ind.maFast.result.result,
            rsi,
            adx = ind.ADX.result.result;
        
        if( this.debug ){
            if( adx < this.adx.min ) this.adx.min = adx;
            else if( adx > this.adx.max ) this.adx.max = adx;
        }
            
        // BEAR TREND
        if( maFast < maSlow )
        {
            rsi = ind.BEAR_RSI.result.result;
            let rsi_hi = this.settings.BEAR_RSI_high,
                rsi_low = this.settings.BEAR_RSI_low;
            
            // ADX trend strength?
            if( adx > this.settings.ADX_high ) rsi_hi = rsi_hi + 15;
            else if( adx < this.settings.ADX_low ) rsi_low = rsi_low -5;
                
            if( rsi > rsi_hi ) this.short();
            else if( rsi < rsi_low ) this.long();
            
            if(this.debug) this.lowHigh( rsi, 'bear' );
            //log.debug('BEAR-trend');
        }

        // BULL TREND
        else
        {
            rsi = ind.BULL_RSI.result.result;
            let rsi_hi = this.settings.BULL_RSI_high,
                rsi_low = this.settings.BULL_RSI_low;
            
            // ADX trend strength?
            if( adx > this.settings.ADX_high ) rsi_hi = rsi_hi + 5;        
            else if( adx < this.settings.ADX_low ) rsi_low = rsi_low -5;
                
            if( rsi > rsi_hi ) this.short();
            else if( rsi < rsi_low )  this.long();
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
    end: function()
    {
        let seconds = ((new Date()- this.startTime)/1000),
            minutes = seconds/60,
            str;
            
        minutes < 1 ? str = seconds + ' seconds' : str = minutes + ' minutes';
        
        log.debug('====================================');
        log.debug('Finished in ' + str);
        log.debug('====================================');
    
        // print stats and messages if debug
        if(this.debug)
        {
            let stat = this.stat;
            log.debug('RSI low/high for period');
            log.debug('BEAR low/high: ' + stat.bear.min + ' / ' + stat.bear.max);
            log.debug('BULL low/high: ' + stat.bull.min + ' / ' + stat.bull.max);
            log.debug('ADX min/max: ' + this.adx.min + ' / ' + this.adx.max);
        }
    }
    
};

module.exports = strat;
