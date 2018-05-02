var helper = require('./helper.js')

var strat = {};

strat.results = {
  stoch: 0,
  longEma: 0,
  shortEma: 0
}

// Prepare everything our strat needs
strat.init = function() {
  //this.stopLoss = TrailingStopLoss();

  this.market = {
    price: {
      movement: 'none',
      duration: null
    },
    stoch: {
      condition: 'none',
      duration: null
    },
    crossover: 'none',
  };

  this.stopLoss = helper.trailingStopLoss();
  this.addTulipIndicator('myStoch', 'stoch', this.settings.myStoch);
  this.addTulipIndicator('myLongEma', 'ema', this.settings.myLongEma);
  this.addTulipIndicator('myShortEma', 'ema', this.settings.myShortEma);
}

// What happens on every new candle?
strat.update = function(candle) {
  this.results.stoch = this.tulipIndicators.myStoch.result;
  this.results.longEma = this.tulipIndicators.myLongEma.result;
  this.results.shortEma = this.tulipIndicators.myShortEma.result;
}

// For debugging purposes.
strat.log = function() {
  //console.log("Stoch Results")
  //console.log(this.results.stoch);
}

strat.check = function(candle) {

  var currentPrice = candle.close;

  //todo cleanup

  // Get indicator information
  var currentPriceMovement = helper.getTrend(this.results.shortEma.result, currentPrice);
  var priceMovementTrending = helper.trending(this.market.price.movement, currentPriceMovement);

  var currentStochCondition = helper.getStochCondition(this.results.stoch.stochK, this.results.stoch.stochD, 20, 80);
  var stochConditionTrending = helper.trending(this.market.stoch.condition, currentStochCondition);

  this.market.price.movement = currentPriceMovement;
  this.market.stoch.condition = currentStochCondition;

  // Tally trend duration
  if (priceMovementTrending)
    this.market.price.duration++;
  else
    this.market.price.duration = null;

  if (stochConditionTrending)
    this.market.stoch.duration++;
  else
    this.market.stoch.duration = null;

  // Create or reset stop-loss
  if (this.market.price.movement === 'uptrend' && this.market.price.duration > 3) {
    if (this.market.stoch.condition === 'oversold' && this.market.stoch.duration > 2) {
      this.advice('long');
      this.stopLoss.create(0.99, currentPrice);
    }
  }
  else if (this.market.price.movement === 'downtrend' && this.market.price.duration > 5) {
    if (this.market.stoch.condition === 'overbought' && this.market.stoch.duration > 1) {
      this.advice('short');
      this.stopLoss.reset();
    }
  }

  // Check if our stoploss has been triggered.
  if (this.stopLoss.triggered(currentPrice)) {
    this.advice('short');
    this.stopLoss.reset();
    console.log("STOP LOSS ACTIVATED");

  } else if (this.stopLoss.active) {
    this.stopLoss.update(currentPrice);
  }
}

strat.end = function() {
  // your code!
}

module.exports = strat;