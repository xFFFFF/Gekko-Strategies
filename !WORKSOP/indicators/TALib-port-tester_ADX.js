var method = {};

method.init = function() {

    this.name = "TALib-port-tester";

    this.addIndicator('ind', 'ADX', 7);
    this.addTalibIndicator("tind", "adx", {optInTimePeriod: 7});
    //this.addTulipIndicator("tuind", "adx", {optInTimePeriod: 7});

};

method.check = function() {};
method.update= function(candle) {

    console.log(this.indicators.ind.result);

    console.log(this.talibIndicators.tind.result);
	  //console.log(this.tulipIndicators.tuind.result);

};
method.log = function() {};

module.exports = method;
