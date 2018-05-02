/**
 * Created by jiaminli on 2017/7/6.
 */

var log = require('../core/log');
var config = require('../core/util.js').getConfig();
var settings = config.enhanced_boll;
var method = {};

//
// 在KDJ中，J值信号不常出现，可是一旦出现，可靠性相当高。大于100为超买，预示未来会回落。小于0则为超卖，预示要反弹。KD的两条线，观察其所在区间，80以上为超买区，20以下为超卖区，其余为徘徊区。 在不同的区间内结合金叉、死叉等走势判断。以K线从下向上与D线交叉为例：K线上穿D线是金叉，为买人信号。但是出现了金叉是否应该买入，还要看别的条件。
// 第一个条件是金叉的位置应该比较低，是在超卖区的位置，越低越好。
// 第二个条件是与D线相交的次数。有时在低位，K线、D线要来回交叉好几次。交叉的次数以2次为最少，越多越好。
// 第三个条件是交叉点相对于KD线低点的位置，这就是常说的“右侧相交”原则。K线是在D线已经抬头向上时才同D线相交，比D线还在下降时与之相交要可靠得多。从KD指标的背离方面考虑。当KD处在高位或低位，如果出现与股价走向的背离，则是采取行动的信号。当KD处在高位，并形成两个依次向下的峰，而此时股价还在一个劲地上涨，这叫“顶背离”，是卖出的信号；与之相反，KD处在低位，并形成一底比一底高，而股价还继续下跌，称为“底背离”，是买入信号。



method.init = function() {

    this.trend = {
        action: 'short',
        over_buy:0,
        over_sell:0,
        previous_K:0,
        previous_D:0,
        last_buy_price:0,
        last_buy_period:0,
        last_sell_period:0
    };
    this.historyCandle=new Array();

    var customBollSettings = {
        optInTimePeriod:settings.optInTimePeriod,
        optInNbDevUp:settings.optInNbDevUp,
        optInNbDevDn:settings.optInNbDevDn,
        optInMAType:settings.optInMAType
    };
    var customVRSettings = {
        period:24
    };
    this.requiredHistory = config.tradingAdvisor.historySize;

    // add the indicator to the method
    this.addTalibIndicator('boll', 'bbands', customBollSettings);
    this.addIndicator('vr', 'VR', customVRSettings);
}

method.update = function (candle) {
    // this.talibIndicators.kdj.run();
    if (this.historyCandle.length < this.requiredHistory) {
        this.historyCandle.unshift(candle);
    }
    else {
        this.historyCandle.unshift(candle);
        this.historyCandle.pop();
    }
};

// For debugging purposes.
method.log = function () {
    // log.debug('calculated random number:');
    // log.debug('\t', this.randomNumber.toFixed(3));
};



method.check = function(candle) {
    // use indicator results
    if(candle.volume===0) return; // Make sure we don't count when the website is down.
    var result = this.talibIndicators.boll.result;
    log.debug(this.indicators.vr.vr);
    // log.debug(result);
    //   outRealLowerBand
    //   outRealMiddleBand
    //   outRealUpperBand


    if(this.trend.action==='short'){
        if(candle.vwp<result.outRealLowerBand){
            this.trend.action='long';
            this.advice('long');
        }
    }
    else if(this.trend.action==='long'){
        if(candle.vwp>result.outRealUpperBand){
            this.trend.action='short';
            this.advice('short');
        }
    }

    // log.debug(result);
    // if (this.trend.action === 'long') {
    //     if (candle.vwp < this.trend.last_buy_price * (1 - settings.force_short_threshold)) {
    //         log.debug("Force selling!");
    //         this.trend.action = 'short';
    //         this.advice('short');
    //         return;
    //     }
    // }
    // var avg_volume = 0;
    // for (var i = 1; i < settings.volume_avg_date + 1; i++) {
    //     avg_volume += this.historyCandle[i].volume;
    // }
    // avg_volume = avg_volume / settings.volume_avg_date;
    //
    //
    // if(this.trend.action==='short'){
    //     //检测金叉
    //     //check the volume
    //     // if(this.trend.last_sell_period!==0 && this.trend.last_sell_period<=settings.sell_last_time) {
    //     //     if (this.trend.previous_D > this.trend.previous_K && result.outSlowD <= result.outSlowK) {
    //     //         // 可能还要涨？
    //     //         log.debug("Buying incase miss the flight");
    //     //         this.trend.action = 'long';
    //     //         this.advice('long');
    //     //         this.trend.last_buy_price = candle.vwp;
    //     //         this.trend.last_sell_period=0;
    //     //         this.trend.last_buy_period=0;
    //     //     }
    //     //     else{
    //     //         this.trend.last_sell_period+=1;
    //     //     }
    //     // }
    //
    //     if(result.outSlowD>=settings.D_low_level && result.outSlowK>=settings.K_low_level){
    //         this.trend.over_buy=0;
    //     }
    //
    //     else if(result.outSlowD<settings.D_low_level || result.outSlowK<settings.K_low_level){
    //         // log.debug("People started to overbuy");
    //         this.trend.over_buy+=1;
    //
    //         if (candle.volume >= avg_volume * settings.volume_multiply) {
    //
    //             if (result.outSlowD>this.trend.previous_D && this.trend.previous_D > this.trend.previous_K && result.outSlowD <= result.outSlowK) {
    //                 //出现金叉
    //                 if(this.trend.over_buy>=settings.period){
    //                     this.trend.action='long';
    //                     this.advice('long');
    //                     this.trend.last_buy_price=candle.vwp;
    //                     this.trend.last_buy_period=1;
    //                 }
    //
    //             }
    //         }
    //         // this.trend.action='long';
    //         // this.advice('long');
    //     }
    //
    // }
    // else if (this.trend.action==='long'){
    //
    //     // if(this.trend.last_buy_period!==0 && this.trend.last_buy_period<=settings.buy_last_time) {
    //     //     if (this.trend.previous_K > this.trend.previous_D && result.outSlowD >= result.outSlowK) {
    //     //         // 可能还要跌？
    //     //         log.debug("Selling incase lose money");
    //     //         log.debug(this.trend.over_sell);
    //     //         this.trend.action = 'short';
    //     //         this.advice('short');
    //     //         this.trend.last_buy_period=0;
    //     //         this.trend.last_sell_period=0;
    //     //     }
    //     //     else{
    //     //         this.trend.last_buy_period+=1;
    //     //     }
    //     // }
    //
    //
    //     if(result.outSlowD<=settings.D_high_level && result.outSlowK<=settings.K_high_level){
    //
    //         this.trend.over_sell=0;
    //     }
    //     else if(result.outSlowD>settings.D_high_level || result.outSlowK>settings.K_high_level){
    //         // log.debug("Best Sell Point");
    //         this.trend.over_sell+=1;
    //
    //         if (candle.volume >= avg_volume * settings.volume_multiply) {
    //
    //             if (result.outSlowD<this.trend.previous_D && this.trend.previous_K > this.trend.previous_D && result.outSlowD >= result.outSlowK) {
    //                 //出现死叉
    //                 if(this.trend.over_sell>=settings.period){
    //                     this.trend.action='short';
    //                     this.advice('short');
    //                     this.trend.last_sell_period=1;
    //                 }
    //             }
    //         }
    //     }
    // }
    // this.trend.previous_D=result.outSlowD;
    // this.trend.previous_K=result.outSlowK;

};
module.exports = method;