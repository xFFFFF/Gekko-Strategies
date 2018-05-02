var convnetjs = require('convnetjs');
var math = require('mathjs');
var log = require('../core/log.js');
var config = require ('../core/util.js').getConfig();


dumpObject = function(obj)
{
	log.debug( "for object :" + obj.constructor.name );
	for(var key in obj) {
		var value = obj[key];
		log.debug( key + "->" + value);
	}
}	

var strategy = 
{
	predictionCount : 0,

	init : function() {

		this.dataBuffer = [];

		this.name = 'Manu Network';
		this.requiredHistory = config.tradingAdvisor.historySize;

		let layers = [
		  {type:'input', out_sx:1, out_sy:1, out_depth: 7},
		  {type:'fc', num_neurons: 12, activation: 'relu'},
		  {type:'fc', num_neurons: 6, activation: 'relu'},
		  {type:'fc', num_neurons: 6, activation: 'relu'},
		  {type:'softmax', num_classes: 3}
		];
		
		this.trend="neutral";

		this.nn = new convnetjs.Net();
		this.nn.makeLayers( layers );
		this.trainer = new convnetjs.Trainer(this.nn, {method: 'adadelta', l2_decay: 0.001,batch_size: 1});
		
		//dumpObject( this.trainer );
		//dumpObject( this.nn );

		// Adding indicators :
		this.addTulipIndicator('myRsi1', 'rsi', { optInTimePeriod: this.settings.RsiPeriod1 });
		this.addTulipIndicator('myRsi2', 'rsi', { optInTimePeriod: this.settings.RsiPeriod2 });

		this.addIndicator('mySMA1', 'SMA', this.settings.SMA1 );
		this.addIndicator('mySMA2', 'SMA', this.settings.SMA2 );
		
		this.buyZonePercent = this.settings.buyZonePercent;
		this.sellZonePercent = this.settings.sellZonePercent;	
		
		
		this.candleStep = 5;
		
		this.debugPeriod = 100000;
		
		this.minWaitingTime = Math.max.apply(null, [this.settings.RsiPeriod1, this.settings.RsiPeriod2, this.settings.SMA1, this.settings.SMA2] );
		
		this.requiredHistory = this.minWaitingTime + this.candleStep;
		
		log.debug("Min waiting time : " + this.minWaitingTime);
		// waiting time to have the indicators Ok to fill the network;
		this.repartitionClassification = [0,0,0];
		this.updateCount = 0;
		this.volumeScale = -1;
		this.priceScale = this.settings.scale;
		log.debug("scale " + this.priceScale);
		
		// Time the whole start :
		this.startTime = new Date();
	},
  
	createClassificationFromData : function(data, futureData)
	{
		var candleClose = data[0];
		var futureCandleClose = futureData[0];
		var diffVariation = (futureCandleClose - candleClose)/candleClose;
		if ( this.predictionCount % this.debugPeriod == 0 )
		{
			log.debug("close : " + candleClose + "-futureClose : " + futureCandleClose + "- variation:"+ diffVariation);
		}
		if( diffVariation > this.buyZonePercent )
			return 0;
		if( diffVariation < ( - this.sellZonePercent ) )
			return 2;
		return 1;
	},

	learn : function () 
	{
		for (let i = 0; i < this.dataBuffer.length - this.candleStep - 1; i++) 
		{
			var expectedResult = this.createClassificationFromData( this.dataBuffer[i]	, this.dataBuffer[i+this.candleStep]) + 1;
			this.repartitionClassification[expectedResult - 1] += 1;	// Classification is 1 based :)
			
			let vol = new convnetjs.Vol(this.dataBuffer[i]);
			if ( this.predictionCount % this.debugPeriod == 0 )
			{
				log.debug("data : " + this.dataBuffer[i] + "-futureData : " + this.dataBuffer[i+this.candleStep] );
				log.debug("expectedResult : " + expectedResult );
				//log.debug("Vol : " + vol.w );
				log.debug("Repartition " + this.repartitionClassification);
			}
			var stats = this.trainer.train(vol, expectedResult);
			this.predictionCount++;
		}
	},
  
	createData : function( candle )
	{
		var smaVal1 = this.indicators.mySMA1.result;
		var smaVal2 = this.indicators.mySMA2.result;
		var RsiVal1 = this.tulipIndicators.myRsi1.result.result;
		var RsiVal2 = this.tulipIndicators.myRsi2.result.result;
		
		data = [ candle.close / this.priceScale, 
				 smaVal1/ this.priceScale,
				 smaVal2/ this.priceScale, 
				 RsiVal1 / 100.0, 
				 RsiVal2 / 100.0, 
				 (candle.high - candle.low ) / this.priceScale * 20.0,
				 candle.volume / this.volumeScale ];
		return data;
	},

	update : function(candle)
	{
		if ( this.priceScale <= 0 )
			this.priceScale = candle.close * 2;
		if (this.volumeScale == -1 )
			this.volumeScale = candle.volume * 2;
		this.updateCount += 1;
		if (this.updateCount < this.minWaitingTime )
			return;
		
		var data = this.createData(candle)
		this.dataBuffer.push(data);
		if (this.dataBuffer.length < this.candleStep)
			return;
		
		var nbIteration = 3;
		//if ( this.predictionCount < 300000)
		//	nbIteration = 1000;
		for (i=0; i < nbIteration; ++i) 
			this.learn();

		while (this.settings.price_buffer_len < this.dataBuffer.length) 
			this.dataBuffer.shift();
	},

	predictCandle : function() 
	{
		var data = this.dataBuffer[ this.dataBuffer.length - 1 ];
		let vol = new convnetjs.Vol(data);
		//log.debug( "data for prediction  : " + data);
		//log.debug("Vol for prediction : " + vol.w );
		let prediction = this.nn.forward(vol);
		if ( this.predictionCount % this.debugPeriod == 0 )
			log.debug( "prediction : " + prediction.w);
		if ( prediction.w[0] > .9)
			return "long";
		if ( prediction.w[2] > .9 )
			return "short";
		return "neutral";		
	},

	check : function(candle) 
	{
		if(this.predictionCount > this.settings.min_predictions)
		{
			var prediction = this.predictCandle();
			if (prediction ==="long" )
			{
				if (this.trend !=="long")
				{
					this.trend ="long";
					log.debug("Buy at: " + candle.close);
					this.advice('long');
				}
			}
			if(prediction === "short")
			{
				if ( this.trend !== "short")
				{
					log.debug("Sell at : " + candle.close);
					this.advice('short');
					this.trend="short";
				}
			}
			if(prediction==="neutral")
			{
				if(this.trend !== "neutral")
					log.debug("Nothing for now");
				this.trend="neutral";
			}
		}
	},
	end: function()
	{
		let seconds = ((new Date()- this.startTime)/1000),
			minutes = seconds/60,
			str;
			
		minutes < 1 ? str = seconds.toFixed(2) + ' seconds' : str = minutes.toFixed(2) + ' minutes';
		
		log.info('====================================');
		log.info('Finished in ' + str);
		log.info('====================================');
	}
};

module.exports = strategy;