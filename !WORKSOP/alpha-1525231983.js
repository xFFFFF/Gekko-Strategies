var helper = require('./helper.js')
var isMatch = require('lodash.ismatch');


var strat = {};

strat.results = {
  stoch: 0,
  longEma: 0,
  shortEma: 0
}

strat.init = function() {
  
  // set market conditions, these will be updated on each candle
  this.market = {
    price: {
      movement: 'none',
      persistance: null
    },
    stoch: {
      condition: 'none',
      persistance: null
    },
  };
  
  // These conditions determine when to buy or to sell.
  this.condition = {
    sell : {
      price : {
        movement : 'downtrend',
        persistance : 1
      },
      stoch : {
        condition : 'overbought',
        persistance : 1
      },
    },
    buy : {
      price : {
        movement : 'downtrend',
        persistance : 1
      },
      stoch : {
        condition : 'oversold',
        persistance : 1
      }
    }
  }
  
  // Initalize our indicators and assign our helper.
  this.stopLoss = helper.trailingStopLoss();
  this.addTulipIndicator('myStoch', 'stoch', this.settings.myStoch);
  this.addTulipIndicator('myLongEma', 'ema', this.settings.myLongEma);
  this.addTulipIndicator('myShortEma', 'ema', this.settings.myShortEma);
  this.addTulipIndicator('myAdx', 'adx', this.settings.myAdx);
}

// What happens on every new candle?
strat.update = function(candle) {
  this.results.stoch = this.tulipIndicators.myStoch.result;
  this.results.longEma = this.tulipIndicators.myLongEma.result;
  this.results.shortEma = this.tulipIndicators.myShortEma.result;
}

strat.check = function(candle) {
  
  var currentPrice = candle.close;
  
  var currentPriceMovement = helper.getTrend(this.results.shortEma.result, currentPrice);
  var priceMovementTrending = helper.trending(this.market.price.movement, currentPriceMovement);

  var currentStochCondition = helper.getStochCondition(this.results.stoch.stochK, this.results.stoch.stochD, this.settings.myStoch.lowThreshold, this.settings.myStoch.highThreshold)
  var stochConditionTrending = helper.trending(this.market.stoch.condition, currentStochCondition);

  this.market.price.movement = currentPriceMovement;
  this.market.stoch.condition = currentStochCondition;

  if (priceMovementTrending)
    this.market.price.persistance++
    else
      this.market.price.persistance = null

  if (stochConditionTrending)
    this.market.stoch.persistance++
  else
    this.market.stoch.persistance = null
  
  // Do our buy conditions match current market conditions?

  if(isMatch(this.market, this.condition.buy)) {
    console.log('Going Long');
    this.advice('long');
    this.stopLoss.create(this.settings.stopLoss, currentPrice)
  }

  // Do our sell conditions match current market conditions?
  if(isMatch(this.market, this.condition.sell)) {
    console.log("Going Short");
    this.advice('short');
    this.stopLoss.reset();
  }
  
  // Check if our stoploss has been triggered.
  if (this.stopLoss.triggered(currentPrice)) {
    this.advice('short')
    this.stopLoss.reset();

  } else if (this.stopLoss.active) {
    this.stopLoss.update(currentPrice);
  }
}

module.exports = strat;