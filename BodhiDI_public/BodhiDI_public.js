
// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function(candle) {
  this.name = 'Bodhi DI';	
  this.requiredHistory = this.tradingAdvisor.historySize;
  
  this.addTulipIndicator('mydi', 'di', this.settings);
  
    this.trend = {
    //direction: 'none',
    //duration: 0,
	state: 'none',
	//persisted: false,
    //adviced: false,
	};
    
}

method.update = function(candle){
	
}

method.log = function(candle) {

}

method.check = function(candle) {

	var diplus = this.tulipIndicators.mydi.result.diPlus;
	var diminus = this.tulipIndicators.mydi.result.diMinus;

	//DI going red
	if(diminus > diplus && diminus > this.settings.diminus && this.trend.state !== 'short') {
		this.trend.state = 'short';
		this.advice('short');
	}
	
	 //DI going green
	if(diplus > diminus && diplus > this.settings.diplus && this.trend.state !== 'long') {
		this.trend.state = 'long';
		this.advice('long');
	}

}

module.exports = method;
