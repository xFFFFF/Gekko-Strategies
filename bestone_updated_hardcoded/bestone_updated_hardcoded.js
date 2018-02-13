var _ = require ('lodash');
var log = require ('../core/log.js');

// Configuration
var config = require ('../core/util.js').getConfig();

//var fun = require ('./functions');
var async = require ('async');

// Let's create our own method
var method = {};


// Prepare everything our method needs
method.init = function () {

    this.name = 'The gambler';

    // Keep state about the current trend
    // Here, on every new candle we use this
    // State object to check if we need to
    // Report it.
    this.trend = {
        direction: 'none',
        duration: 0,
        persisted: false,
        adviced: false
    };

    // How many candles do we need as a base
    // Before we can start giving advice?
    this.requiredHistory = config.tradingAdvisor.historySize;

    var customMACDSettings = {
        optInFastPeriod: 10,
        optInSlowPeriod: 21,
        optInSignalPeriod: 9
    };

    var customEMAshortSettings = {
        optInTimePeriod: 9
    };

    var customEMAlongSettings = {
        optInTimePeriod: 21
    };

    var customOBVSettings = {
    };

    var customSTOCHSettings = {
        optInFastK_Period: 9,
        optInSlowK_Period: 3,
        optInSlowK_MAType: 1,
        optInSlowD_Period: 3,
        optInSlowD_MAType: 1
    };

    var customRSISettings = {
        optInTimePeriod: 14
    };

    this.addTalibIndicator('myMACD', 'macd', customMACDSettings);
    this.addTalibIndicator('myOBV', 'obv', customOBVSettings);
    this.addTalibIndicator('myEMAshort', 'ema', customEMAshortSettings);
    this.addTalibIndicator('myEMAlong', 'ema', customEMAlongSettings);
    this.addTalibIndicator('myRSI', 'rsi', customRSISettings);

    this.addTalibIndicator('mySTOCH', 'stoch', customSTOCHSettings);
}

// What happens on every new candle?
method.update = function (candle) {
}

// For debugging purposes: log the last calculated
// EMAs and diff.
method.log = function () {
    log.info (new Date().toLocaleString());
    log.info ('calculated TALIB properties for candle:');
}

method.check = function (candle) {
    if (candle.close.length < this.requiredHistory) {
        // TODO: still needed?!
        return;
    }

    var macd_result = this.talibIndicators.myMACD.result;
    var macd = macd_result['outMACD'];

    var obv = this.talibIndicators.myOBV.result.outReal;
    var rsi = this.talibIndicators.myRSI.result.outReal;
    var emashort = this.talibIndicators.myEMAshort.result.outReal;
    var emalong = this.talibIndicators.myEMAlong.result.outReal;
    var stochK = this.talibIndicators.mySTOCH.result.outSlowK;
    var stochD = this.talibIndicators.mySTOCH.result.outSlowD;

    if (macd) macd = macd.toFixed(8);
    if (obv) obv = obv.toFixed(8);
    if (rsi) rsi = rsi.toFixed(8);
    if (emashort) emashort = emashort.toFixed(8);
    if (emalong) emalong = emalong.toFixed(8);
    if (stochK) stochK = stochK.toFixed(8);
    if (stochD) stochD = stochD.toFixed(8);

    log.info('\t', "macd:",  macd);
    log.info('\t', "obv:",  obv);
    log.info('\t', "rsi:",  rsi);
    log.info('\t', "stochK:", stochK);
    log.info('\t', "stochD:", stochD);
    log.info('\t', "emashort:", emashort);
    log.info('\t', "emalong:", emalong);

    if (emashort > emalong && stochK > stochD && macd > 0 && rsi > 50) {

        // New trend detected
        if (this.trend.direction !== 'up')
        // Reset the state for the new trend
            this.trend = {
                duration: 0,
                persisted: false,
                direction: 'up',
                adviced: false
            };

        this.trend.duration ++;

        log.debug ('In uptrend since', this.trend.duration, 'candle (s)');

        if (this.trend.duration >= 1) this.trend.persisted = true;

        if (this.trend.persisted &&! this.trend.adviced) {
            this.trend.adviced = true;
            this.advice ('long');
        } else this.advice ();

    } else if (emashort> emalong && stochK <stochD && macd < 0 && rsi < 50) {

        // New trend detected
        if (this.trend.direction !== 'down')
        // Reset the state for the new trend
            this.trend = {
                duration: 0,
                persisted: false,
                direction: 'down',
                adviced: false
            };

        this.trend.duration ++;

        log.debug ('In downtrend since', this.trend.duration, 'candle (s)');

        if (this.trend.duration >= 1) this.trend.persisted = true;

        if (this.trend.persisted &&! this.trend.adviced) {
            this.trend.adviced = true;
            this.advice ('short');
        } else this.advice ();

    } else {

        log.debug ('In no trend');
        this.advice ();
    }
}

module.exports = method;
