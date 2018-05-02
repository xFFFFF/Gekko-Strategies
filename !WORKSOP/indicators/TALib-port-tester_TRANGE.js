var method = {};

method.init = function() {

    this.name = "TALib-port-tester";

    this.addIndicator('ind', 'TRANGE', 7);
    this.addTalibIndicator("tind", "trange", {optInTimePeriod: 7});
    this.addTulipIndicator("tuind", "tr", {optInTimePeriod: 7});

};

method.check = function() {};
method.update= function(candle) {

    console.log(this.indicators.ind.result);

    console.log(this.talibIndicators.tind.result);
	  console.log(this.tulipIndicators.tuind.result);

};
method.log = function() {};

module.exports = method;
