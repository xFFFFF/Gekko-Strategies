// If you want to use your own trading methods you can
// write them here. For more information on everything you
// can use please refer to this document:
// 
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md

var config = require('../core/util.js').getConfig();
var settings = config['lsma'];

// Let's create our own method
var method = {};

// Prepare everything our method needs
method.init = function () {
    this.name = 'lsma'
    this.status = 'history';
    this.previousCandle=null;

    this.requiredHistory = config.tradingAdvisor.historySize;

    this.addTalibIndicator('linearreg', 'linearreg', settings.linearreg);
    this.addTalibIndicator('rsi', 'rsi', settings.rsi);
    this.addTalibIndicator('atr', 'atr', settings.atr);
}

// What happens on every new candle?
method.update = function (candle) {
    if (this.status=='history')
        this.previousCandle=candle;
}


method.log = function () {
    // nothing!
}

// Based on the newly calculated
// information, check if we should
// update or not.
method.check = function (candle) {
    var lr = this.talibIndicators.linearreg.result['outReal'];
    var rsi = this.talibIndicators.rsi.result['outReal'];
    var atr = this.talibIndicators.atr.result['outReal'];

    switch (this.status) {
        case 'history':
            this.status='waiting';
            break;
        case 'waiting':
            if (this.isEntryLong(candle,lr,rsi,atr)) {
                this.openLongPosition(candle);
            }
            break;
        case 'long':
            if (this.isExitLong(candle,lr,rsi,atr)) {
                this.closeLongPosition(candle);
            }
    }
    this.previousCandle=candle;
}

method.isEntryLong = function(candle,lr,rsi,atr) {
    /*
        entry conditions:
        1 rsi<30 + candle < lr + atr>min
        2 rsi>30
        3 close>lr
     */
    if (this.entryStage==undefined)
        this.entryStage=0;
    switch (this.entryStage) {
        case 0:
            if (candle.close<lr
                && candle.open<lr
                && rsi<settings.thresholds.rsiLow
                && atr>settings.thresholds.atrMinPercent*candle.close)
                this.entryStage=1;
            return false;
        case 1:
            if (rsi>=settings.thresholds.rsiLow)
                this.entryStage=2;
            return false;
        case 2:
            if (candle.close>lr) {
                // reset
                this.entryStage=0;
                return true;
            }
            return false;
    }
    return false;
}

method.isExitLong = function(candle,lr,rsi,atr) {
    if (candle.close<this.stopLoss || candle.close<this.trailingStop || candle.close>=this.takeProfit)
        return true;
    // check inversion
    if (candle.close<lr)
        this.inversionConfirms++;
    else
        this.inversionConfirms=0;

    if (this.inversionConfirms>=settings.exit.inversionConfirms)
        return true;

    // we are still in position, move the trails
    let offset=candle.close*(1.0-settings.exit.offsetCoeff);
    if (offset>this.trailing)
        this.trailing=offset;
    
    switch (settings.exit.raiseStopLoss) {
        case 'trailToEven':
            if (candle.close<this.breakEven && this.stopLoss<candle.close)
                this.stopLoss=candle.close;
            // intentionally no break
        case 'jumpToEven':
            if (candle.close>this.breakEven)
                this.stopLoss=this.breakEven
            break;
        case 'disabled':
            //do nothing
            break;
    }
    return false;
}

method.openLongPosition = function(candle) {
    this.advice='long';
    this.status='long';
    this.stopLoss=Math.min(this.previousCandle.low,candle.low);
    this.takeProfit=candle.close+(candle.close-this.stopLoss)*settings.exit.riskRatio;
    this.trailing=candle.close*(1.0-settings.exit.offsetCoeff);
    let fee=settings.paperTrader.fee;
    this.breakEven=(candle.close*(1+fee))/(1-fee);
    this.inversionConfirms=0;
}

method.closeLongPosition = function(candle) {
    this.advice='short';
    this.status='waiting';
}



module.exports = method;

/*
{ name: 'LINEARREG',
  group: 'Statistic Functions',
  hint: 'Linear Regression',
  inputs: [ { name: 'inReal', type: 'real' } ],
  optInputs:
   [ { name: 'optInTimePeriod',
       displayName: 'Time Period',
       defaultValue: 14,
       hint: 'Number of period',
       type: 'integer_range' } ],
  outputs: [ { '0': 'line', name: 'outReal', type: 'real', flags: {} } ] }

  { name: 'ATR',
  group: 'Volatility Indicators',
  hint: 'Average True Range',
  inputs: [ { name: 'inPriceHLC', type: 'price', flags: [Object] } ],
  optInputs:
   [ { name: 'optInTimePeriod',
       displayName: 'Time Period',
       defaultValue: 14,
       hint: 'Number of period',
       type: 'integer_range' } ],
  outputs: [ { '0': 'line', name: 'outReal', type: 'real', flags: {} } ] }

  { name: 'RSI',
  group: 'Momentum Indicators',
  hint: 'Relative Strength Index',
  inputs: [ { name: 'inReal', type: 'real' } ],
  optInputs:
   [ { name: 'optInTimePeriod',
       displayName: 'Time Period',
       defaultValue: 14,
       hint: 'Number of period',
       type: 'integer_range' } ],
  outputs: [ { '0': 'line', name: 'outReal', type: 'real', flags: {} } ] }

  { name: 'MACD',
  group: 'Momentum Indicators',
  hint: 'Moving Average Convergence/Divergence',
  inputs: [ { name: 'inReal', type: 'real' } ],
  optInputs:
   [ { name: 'optInFastPeriod',
       displayName: 'Fast Period',
       defaultValue: 12,
       hint: 'Number of period for the fast MA',
       type: 'integer_range' },
     { name: 'optInSlowPeriod',
       displayName: 'Slow Period',
       defaultValue: 26,
       hint: 'Number of period for the slow MA',
       type: 'integer_range' },
     { name: 'optInSignalPeriod',
       displayName: 'Signal Period',
       defaultValue: 9,
       hint: 'Smoothing for the signal line (nb of period)',
       type: 'integer_range' } ],
  outputs:
   [ { '0': 'line', name: 'outMACD', type: 'real', flags: {} },
     { '0': 'line_dash',
       name: 'outMACDSignal',
       type: 'real',
       flags: {} },
     { '0': 'histogram', name: 'outMACDHist', type: 'real', flags: {} } ] }



 */