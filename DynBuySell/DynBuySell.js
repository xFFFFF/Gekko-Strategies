/**
 * Simple template with stop loss and min sale % already implemented.
 */

// a ping pong implementation, but does not work well.
var log = require('../core/log.js');
// Let's create our own buy and sell strategy
var strat = {};

// Prepare everything our strat needs
strat.init = function() {

	// we don't know what we did buy at when we start gekko
	this.previousActionPrice = 0;
	// temp value to store candle.close to move to previousCandleClose
	this.currentCandleClose = 0;
	// we don't know what we did buy at when we start gekko
	this.previousCandleClose = 0;
	// find the max to calculate the stoploss.
	this.lastHigh = 0;
	// find the low to force buy
	this.lastLow = Number.MAX_VALUE;
	// next sell target
	this.nextSell = Number.MAX_VALUE;
	// next buy price
	this.nextBuy = 0;
	// last action
	this.previousAction = 'none';
	// keep state about the current trend
	// here, on every new candle we use this
	// state object to check if we need to
	// report it.
	this.trend = {
		direction : 'none',
		duration : 0,
		persisted : false,
		adviced : false,
	};

	// how many candles do we need as a base
	// before we can start giving advice?
	this.requiredHistory = this.tradingAdvisor.historySize;

}

//What happens on every new candle?
strat.update = function(candle) {
	if (this.lastHigh < candle.high) {
		this.lastHigh = candle.high;
		log.debug('Max seen updated to: ', this.lastHigh);
	}
	if (this.lastLow > candle.low) {
		this.lastLow = candle.low;
		log.debug('Low seen updated to: ', this.lastLow);
	}
	this.previousCandleClose = this.currentCandleClose;
	this.currentCandleClose = candle.close;
}


// For debugging purposes.
strat.log = function() {
	log.debug('*** new Candle***');
}

// our stop loss strategy;
strat.stoploss = function(candle) {
	// calculate the stop loss price in order to sell
	const stop_loss = this.lastHigh * this.settings.thresholds.stop_loss_pct;
	if (candle.close < stop_loss) {
		if (this.previousAction != 'stoploss') {
			log.debug('*** Stoploss sell. ***', candle.close);
			this.previousActionPrice = candle.close;
			this.previousAction = 'stoploss';
			this.advice('short'); // sell now!
			this.trend = {
				direction : 'down',
				duration : 0,
				persisted : false,
				adviced : true,
			};
			return true;
		} else {
			if (candle.close <= this.previousActionPrice) {
				// market in free fall, disable buy..
				log.debug('*** Freefall detected. ***', candle.close);
				this.previousActionPrice = candle.close;
				this.advice();
				return true;
			} else {
				// we can start buying again...reset the lastHigh
				log.debug('*** Exit Freefall. ***', candle.close);
				this.previousActionPrice = candle.close;
				this.lastHigh = candle.high;
				this.lastLow = candle.low;
				this.previousAction = 'sell';
				return true;
			}
		}
	} 
	if (this.previousAction == 'stoploss'){
		// cleanup!
		log.debug('*** Clean up Freefall. ***', candle.close);
		this.previousActionPrice = candle.close;
		this.lastHigh = candle.high;
		this.lastLow = candle.low;
		this.previousAction = 'sell';
	}
	return false;
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function(candle) {
	if (this.stoploss(candle)) {
		return;
	}
	
    if (this.previousAction == 'none') {
		log.debug('>>>>>   INIT   <<<<<<<<<<<<');
		this.previousActionPrice = candle.high;
		this.previousAction = 'sell';
	} else if (this.previousAction === "buy") {
		// calculate the minimum price in order to sell
		const threshold = this.previousActionPrice
				* this.settings.thresholds.sell_at;

		// we sell if the price is more than the required threshold
		// and the trend is down.
		if (candle.close > threshold
				&& this.previousCandleClose > candle.close) {
			this.advice('short');
			log.debug('>>>>>   SIGNALING ADVICE SHORT   <<<<<<<<<<<<');
			this.previousAction = 'sell';
			this.previousActionPrice = candle.close;
			this.lastLow = candle.low;
			this.lastHigh = candle.close; /// added
		}
	} else if (this.previousAction === "sell") {
		// calculate the minimum price in order to buy some
		const threshold = this.previousActionPrice
				* this.settings.thresholds.buy_at;

		// calculate the price at which we should buy again if market goes up
		const sellat_up_price = this.previousActionPrice
				* this.settings.thresholds.buy_at_up;

		// we buy if the price is less than the required threshold or greater
		// than Market Up threshold
		// and trend is up.
		if (((candle.close < threshold) || (candle.close > sellat_up_price))
				&& this.previousCandleClose < candle.close) {
			this.advice('long');
			log.debug('>>>>>   SIGNALING ADVICE LONG   <<<<<<<<<<<<');
			this.previousAction = 'buy';
			this.previousActionPrice = candle.close;
			this.lastHigh = candle.close;
			this.lastLow = candle.low; /// added
		}
	}
}

module.exports = strat;
