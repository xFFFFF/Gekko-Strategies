var method = {};

method.init = function() {

    this.name = "TALib-port-tester";


    var DXsetting = {optInTimePeriod: 7}
    this.addIndicator('ind', 'DX', 7);
    this.addTalibIndicator("tind", "dx", DXsetting);
    this.addTulipIndicator("tuind", "dx", DXsetting);



};




method.check = function() {};
method.update= function(candle) {



    console.log(this.indicators.ind.result);
    console.log(this.talibIndicators.tind.result);
	  console.log(this.tulipIndicators.tuind.result);

};
method.log = function() {};

module.exports = method;
