/**
 * Created by jiaminli on 2017/7/7.
 */
/**
 * Created by jiaminli on 2017/7/6.
 */

var log = require('../core/log');
var config = require('../core/util.js').getConfig();
var method = {};

method.init = function() {

    this.trend = {
        action: 'short',
        over_buy:0,
        over_sell:0
    };


    var customStochSettings = {
        optInFastK_Period:9,
        optInSlowK_Period:3,
        optInSlowK_MAType:0,
        optInSlowD_Period:3,
        optInSlowD_MAType:0
    }
    this.requiredHistory = config.tradingAdvisor.historySize;

    // add the indicator to the method
    this.addTalibIndicator('kdj', 'stoch', customStochSettings);
}

method.update = function (candle) {
    // this.talibIndicators.kdj.run();
}

// For debugging purposes.
method.log = function () {
    // log.debug('calculated random number:');
    // log.debug('\t', this.randomNumber.toFixed(3));
}



method.check = function() {
    // use indicator results
    var result = this.talibIndicators.kdj.result;
    log.debug(result);
    if(this.trend.action==='short'){
        if(result.outSlowD>=10 || result.outSlowK>=10){
            if(this.trend.over_buy>=5){
                this.trend.action='long';
                this.advice('long');
            }
            this.trend.over_buy=0;
            return;
        }
        if(result.outSlowD<10 && result.outSlowK<10){
            log.debug("People started to overbuy");
            this.trend.over_buy+=1;
            // this.trend.action='long';
            // this.advice('long');
        }

    }
    else if (this.trend.action==='long'){
        if(result.outSlowD<=90 || result.outSlowK<=90){
            if(this.trend.over_sell>=5){
                this.trend.action='short';
                this.advice('short');
            }
            this.trend.over_sell=0;
            return;
        }
        if(result.outSlowD>90 && result.outSlowK>90){
            log.debug("Best Sell Point");
            this.trend.over_sell+=1;
        }
    }
    // do something with macdiff
};
module.exports = method;