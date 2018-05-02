// Downloaded from: https://github.com/xFFFFF/Gekko-Strategies
/*
	RSI Bull and Bear + ADX modifier
	1. Use different RSI-strategies depending on a longer trend
	2. But modify this slighly if shorter BULL/BEAR is detected
	-
	(CC-BY-SA 4.0) Tommie Hansen
	https://creativecommons.org/licenses/by-sa/4.0/
	
	UPDATE:
	3. Add pingPong for sideways market
	
	Rafael Martín.
*/

// req's
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();

// strategy
var strat = {
	
	/* INIT */
	init: function()
	{
		// core
		this.name = 'RSI Bull and Bear + ADX + PingPong';
		this.requiredHistory = config.tradingAdvisor.historySize;
		this.resetTrend();
		
		// debug? set to false to disable all logging/messages/stats (improves performance in backtests)
		this.debug = false;
		
		// performance
		config.backtest.batchSize = 1000; // increase performance
		config.silent = true;
		config.debug = false;
		
		// SMA
		this.addTulipIndicator('maSlow', 'sma', { optInTimePeriod: this.settings.SMA_long });
		this.addTulipIndicator('maFast', 'sma', { optInTimePeriod: this.settings.SMA_short });
		
		// RSI
		this.addTulipIndicator('BULL_RSI', 'rsi', { optInTimePeriod: this.settings.BULL_RSI });
		this.addTulipIndicator('BEAR_RSI', 'rsi', { optInTimePeriod: this.settings.BEAR_RSI });
		
		// ADX
		this.addTulipIndicator('ADX', 'adx', { optInTimePeriod: this.settings.ADX })
		
		// MOD (RSI modifiers)
		this.BULL_MOD_high = this.settings.BULL_MOD_high;
		this.BULL_MOD_low = this.settings.BULL_MOD_low;
		this.BEAR_MOD_high = this.settings.BEAR_MOD_high;
		this.BEAR_MOD_low = this.settings.BEAR_MOD_low;
		
		
		// debug stuff
		this.startTime = new Date();
		
		// add min/max if debug
		if( this.debug ){
			this.stat = {
				adx: { min: 1000, max: 0 },
				bear: { min: 1000, max: 0 },
				bull: { min: 1000, max: 0 }
			};
		}
		
		/* MESSAGES */
		
		// message the user about required history
		log.info("====================================");
		log.info('Running', this.name);
		log.info('====================================');
		log.info("Make sure your warmup period matches SMA_long and that Gekko downloads data if needed");
		
		// warn users
		if( this.requiredHistory < this.settings.SMA_long )
		{
			log.warn("*** WARNING *** Your Warmup period is lower then SMA_long. If Gekko does not download data automatically when running LIVE the strategy will default to BEAR-mode until it has enough data.");
		}
		
	}, // init()
	
	
	/* RESET TREND */
	resetTrend: function()
	{
		var trend = {
			duration: 0,
			direction: 'none',
			longPos: false, // this will be false or a price if we already have a long position
			pingPong : {
				gainsPercentage: this.settings.PINGPONG_GAINS_PERCENTAGE // when we want to close the long position?
			}
		};
	
		this.trend = trend;
	},
	
	
	/* get low/high for backtest-period */
	lowHigh: function( val, type )
	{
		let cur;
		if( type == 'bear' ) {
			cur = this.stat.bear;
			if( val < cur.min ) this.stat.bear.min = val; // set new
			else if( val > cur.max ) this.stat.bear.max = val;
		}
		else if( type == 'bull' ) {
			cur = this.stat.bull;
			if( val < cur.min ) this.stat.bull.min = val; // set new
			else if( val > cur.max ) this.stat.bull.max = val;
		}
		else {
			cur = this.stat.adx;
			if( val < cur.min ) this.stat.adx.min = val; // set new
			else if( val > cur.max ) this.stat.adx.max = val;
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
		
			
		// BEAR TREND
		if( maFast < maSlow )
		{
			rsi = ind.BEAR_RSI.result.result;
			let rsi_hi = this.settings.BEAR_RSI_high,
				rsi_low = this.settings.BEAR_RSI_low;
			
			// ADX trend strength?
			if( adx > this.settings.ADX_high ) rsi_hi = rsi_hi + this.BEAR_MOD_high;
			else if( adx < this.settings.ADX_low ) rsi_low = rsi_low + this.BEAR_MOD_low;
				
			if( rsi > rsi_hi ) this.short();
			else if( rsi < rsi_low ) this.long();
			//else this.pingPong();
			
			if(this.debug) this.lowHigh( rsi, 'bear' );
		}

		// BULL TREND
		else
		{
			rsi = ind.BULL_RSI.result.result;
			let rsi_hi = this.settings.BULL_RSI_high,
				rsi_low = this.settings.BULL_RSI_low;
			
			// ADX trend strength?
			if( adx > this.settings.ADX_high ) rsi_hi = rsi_hi + this.BULL_MOD_high;		
			else if( adx < this.settings.ADX_low ) rsi_low = rsi_low + this.BULL_MOD_low;
				
			if( rsi > rsi_hi ) this.short();
			else if( rsi < rsi_low )  this.long();
			else this.pingPong();
			
			if(this.debug) this.lowHigh( rsi, 'bull' );
		}
		
		// add adx low/high if debug
		if( this.debug ) this.lowHigh( adx, 'adx');
	
	}, // check()
	
	
	/* LONG */
	long: function()
	{
		if( this.trend.direction !== 'up' ) // new trend? (only act on new trends)
		{
			this.resetTrend();
			this.trend.direction = 'up';
			this.trend.longPos = this.candle.close;
			this.advice('long');
			if( this.debug ) log.info('Going long');
		}
		
		if( this.debug )
		{
			this.trend.duration++;
			log.info('Long since', this.trend.duration, 'candle(s)');
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
			this.trend.longPos = false;
			this.advice('short');
			if( this.debug ) log.info('Going short');
		}
		
		if( this.debug )
		{
			this.trend.duration++;
			log.info('Short since', this.trend.duration, 'candle(s)');
		}
	},
	
	pingPong: function() {
		
		/**
		* Si actualmente tenemos una posicion long abierta vamos a comprobar si el precio 
		* actual del asset es un <gainsPercentage> más alto (trend.long + %gainsPercentage >= currentPrice)
		* y si es así cerramos la posición.
		*/
		if (this.trend.longPos) {
			
			/**
			* Si tenemos una posicion long abierta pero la tendencia actual es bullish entonces 
			* no hacemos nada y dejamos que siga subiendo
			*/
			//if (this.trend.direction == 'up') return;
			
			if (this.candle.close < (this.trend.longPos - (this.trend.longPos * (this.trend.pingPong.gainsPercentage / 3) / 100))) this.trend.longPos = this.candle.close; 
						
			/**
			* Si no tenemos un porcentage de ganancias salimos de aqui
			*/
			if (this.candle.close < (this.trend.longPos + (this.trend.longPos * this.trend.pingPong.gainsPercentage / 100) )) return;
			
			/**
			* Si hemos llegado hasta aqui significa que tenemos un long abierto, la tendencia actual es 
			* bajista y tenemos un <gainsPercentage> de ganancias, por lo tanto cerramos la posicion
			* para recoger ganancias y ponemos el longPos en false.
			*/
			this.trend.longPos = false;
			this.advice('short');
		
		
		/**
		* Si hemos llegado hasta aqui significa que no tenemos ninguna posicion long abierta, por lo tanto 
		* podemos aprovechar para abrir una nueva posicion cuando sea el momento propicio.
		*/
		} else {
			
			/**
			* Si estamos en tendencia bajista salimos de aqui sin hacer nada, asi dejamos que siga 
			* bajando y solo actuamos cuando la tendencia cambie a alcista (bullish).
			*/
			if (this.trend.direction == 'down') return;
			
			/**
			* Si ha bajado al menos un <gains_percentage> abrimos un nuevo long
			*/
			//if (this.candle.close < (this.trend.longPos - (this.trend.longPos * this.trend.pingPong.gainsPercentage / 100) )) return;

			
			/**
			* Si hemos llegado hasta aqui significa que se cumple los requisitos necesarios para volver a 
			* abrir una posicion long, por lo tanto ejecutamos un long y ademas guardamos el precio de la 
			* candle actual para saber a que precio hemos iniciado el long.
			*/
			this.trend.longPos = this.candle.close;
			this.advice('long');
			
		}
	},
	
	
	/* END backtest */
	end: function()
	{
		let seconds = ((new Date()- this.startTime)/1000),
			minutes = seconds/60,
			str;
			
		minutes < 1 ? str = seconds.toFixed(2) + ' seconds' : str = minutes.toFixed(2) + ' minutes';
		
		log.info('====================================');
		log.info('Finished in ' + str);
		log.info('====================================');
	
		// print stats and messages if debug
		if(this.debug)
		{
			let stat = this.stat;
			log.info('BEAR RSI low/high: ' + stat.bear.min + ' / ' + stat.bear.max);
			log.info('BULL RSI low/high: ' + stat.bull.min + ' / ' + stat.bull.max);
			log.info('ADX min/max: ' + stat.adx.min + ' / ' + stat.adx.max);
		}
		
	}
	
};

module.exports = strat;
