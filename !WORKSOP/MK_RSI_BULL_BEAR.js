/*
    RSI Bull and Bear
    Use different RSI-strategies depending on a longer trend
    3 feb 2017
    
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
        this.name = 'MK RSI Bull and Bear';
        this.requiredHistory = config.tradingAdvisor.historySize;
        this.resetTrend();
        
        // debug? set to flase to disable all logging (improves performance)
        this.debug = true;
        
    /*    // add indicators
        this.addTulipIndicator('maSlow', 'sma', { optInTimePeriod: this.settings.SMA_long });
        this.addTulipIndicator('maFast', 'sma', { optInTimePeriod: this.settings.SMA_short });
        this.addTulipIndicator('BULL_SLOW_RSI', 'rsi', { optInTimePeriod: this.settings.BULL_SLOW_RSI });
        this.addTulipIndicator('BULL_FAST_RSI', 'rsi', { optInTimePeriod: this.settings.BULL_FAST_RSI });
        this.addTulipIndicator('BEAR_SLOW_RSI', 'rsi', { optInTimePeriod: this.settings.BEAR_SLOW_RSI });
        this.addTulipIndicator('BEAR_FAST_RSI', 'rsi', { optInTimePeriod: this.settings.BEAR_FAST_RSI });
    */

        this.twitterNotifPercent =1;


        this.params=this.congigureParams(this.twitterNotifPercent);

        this.congigureTrends();    

        // debug stuff
        this.startTime = new Date();
        this.stat = {
            bear: { min: 100, max: 0 },
            bull: { min: 100, max: 0 }
        };


                
    }, // init()
    
    congigureTrends:function(){
        this.addTulipIndicator('maSlow', 'sma', { optInTimePeriod: this.params.SMA_long });
        this.addTulipIndicator('maFast', 'sma', { optInTimePeriod: this.params.SMA_short });
        this.addTulipIndicator('BULL_SLOW_RSI', 'rsi', { optInTimePeriod: this.params.BULL_SLOW_RSI });
        this.addTulipIndicator('BULL_FAST_RSI', 'rsi', { optInTimePeriod: this.params.BULL_FAST_RSI });
        this.addTulipIndicator('BEAR_SLOW_RSI', 'rsi', { optInTimePeriod: this.params.BEAR_SLOW_RSI });
        this.addTulipIndicator('BEAR_FAST_RSI', 'rsi', { optInTimePeriod: this.params.BEAR_FAST_RSI });
    },
    congigureParams:function(sentimentPercent){
        return {
            SMA_long:this.settings.SMA_long ,
            SMA_short:this.settings.SMA_short ,    

            BULL_SLOW_RSI:this.settings.BULL_SLOW_RSI ,
            BULL_FAST_RSI:this.settings.BULL_FAST_RSI ,
            BEAR_SLOW_RSI:this.settings.BEAR_SLOW_RSI ,
            BEAR_FAST_RSI:this.settings.BEAR_FAST_RSI ,

            BULL_RSI_LOW:this.settings.BULL_RSI_LOW,
            BULL_RSI_HIGH:this.settings.BULL_RSI_HIGH,
            BEAR_RSI_LOW:this.settings.BEAR_RSI_LOW,
            BEAR_RSI_HIGH:this.settings.BEAR_RSI_HIGH,     
            
            SENTIMENT_BULL_RSI_LOW:this.settings.BULL_RSI_LOW * sentimentPercent,
            SENTIMENT_BULL_RSI_HIGH:this.settings.BULL_RSI_HIGH * sentimentPercent,
            SENTIMENT_BEAR_RSI_LOW:this.settings.BEAR_RSI_LOW * sentimentPercent,
            SENTIMENT_BEAR_RSI_HIGH:this.settings.BEAR_RSI_HIGH  * sentimentPercent               
        };
    },
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
    
    update: function(){
        //check tweetmybot for notification
        //set the twitterNotifPercent accordinglt
        //call congigureParams(twitterNotifPercent) to adjust the BULL / BEAR high/lows accordingly
        //this.twitterNotifPercent =1.2;
    },
    /* CHECK */
    check: function()
    {
        if( this.candle.close.length < this.requiredHistory ) { return; } // check if candle length is correct
        
        // get all indicators
        let ind = this.tulipIndicators,
            maSlow = ind.maSlow.result.result,
            maFast = ind.maFast.result.result,
            rsi,rsiFast,rsiSlow;
            
        if(!maFast || !maSlow)
            return;
            
        // BEAR TREND
        if( maFast < maSlow )
        {

            if(!ind.BEAR_FAST_RSI.result || !ind.BEAR_SLOW_RSI.result || !ind.BEAR_FAST_RSI.result.result || !ind.BEAR_SLOW_RSI.result.result)
                return;

            //if fast < slow then sell
            rsiFast = ind.BEAR_FAST_RSI.result.result;
            rsiSlow = ind.BEAR_SLOW_RSI.result.result;           

            if(rsiFast < rsiSlow && rsiFast > this.params.SENTIMENT_BEAR_RSI_HIGH){
                this.short();
            }
            else if(rsiFast > rsiSlow && rsiFast < this.params.SENTIMENT_BEAR_RSI_LOW){
                this.long();
            }

            if(this.debug) this.lowHigh( rsiFast, 'bear' );
            //log.debug('BEAR-trend');
        }

        // BULL TREND
        else
        {
            if(!ind.BULL_FAST_RSI.result || !ind.BULL_SLOW_RSI.result || !ind.BULL_FAST_RSI.result.result || !ind.BULL_SLOW_RSI.result.result)
                return;

            rsiFast = ind.BULL_FAST_RSI.result.result;
            rsiSlow = ind.BULL_SLOW_RSI.result.result;

            if(rsiFast < rsiSlow && rsiFast > this.params.SENTIMENT_BULL_RSI_HIGH)
                this.short();
            else if(rsiFast > rsiSlow && rsiFast < this.params.SENTIMENT_BULL_RSI_LOW)
                this.long();

            if(this.debug) this.lowHigh( rsiFast, 'bull' );
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

