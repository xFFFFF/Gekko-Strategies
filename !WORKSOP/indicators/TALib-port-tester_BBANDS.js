var method = {};

method.init = function() {

    this.name = "TALib-port-tester";


var BollingerSettings = {

       TimePeriod: 20,
        NbDevUp: 2,
        NbDevDn: 2,
        optInMAType: 2


}
var TABollingerSettings = {

       optInTimePeriod: 20,
        optInNbDevUp: 2,
        optInNbDevDn: 2,
        optInMAType: 2,
optInNbStdDevs: 2

}
    this.addIndicator('ind', 'BB', BollingerSettings);
    this.addTalibIndicator("tind", "bbands", TABollingerSettings);
    this.addTulipIndicator("tuind", "bbands", TABollingerSettings);
};


method.check = function() {};
method.update= function(candle) {

var bbands = this.indicators.ind;

	console.log('L ' + bbands.lower);
	console.log('M ' + bbands.middle);
	console.log('U ' + bbands.upper);
    console.log(this.tulipIndicators.tuind.result);
    console.log(this.talibIndicators.tind.result);

};
method.log = function() {};

module.exports = method;
