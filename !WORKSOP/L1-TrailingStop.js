// This is an initial implementation of a Trailing stop order strategy.
// If buy is set to true the strategy will attempt to buy the currency at the specified buyPrice.
// If things go as expected and sell is set to true, the stock will be sold at the specified sellPrice.   
// Lastly, if things don't go that well the stock will be sold at it's stopValue.
// If buy and sell is true, the sellPrice must be larger than the buyPrice.
// The stopValue is calculated as follows:
//    if movingStopValue is true, it will be a trailing stopValue(StopValue = HighestValue - trailingValueIncrement),
//    if not it will be a fixed value specified by initialStopValue.
// Status:
//    This has had minimal testing so don't trust it.
// Known Issues:
//  1) Buying and selling are done at ask rates which reduce profits significantly
var log = require('../core/log');

var strat = {};

// Prepare everything our method needs
strat.init = function () {
  log.debug("Init Strategy");
  this.requiredHistory = 0;

  this.trend = {
    highestValue: 0,
    currentValue: 0,
    stopValue: 0,
    purchased: false,
    currentTrend: "none",
    completed: false,
    initialMarketValueHigherThanBuyPrice: false
  };

  if (this.trend.buy && this.trend.buyPrice == 0) {
    this.trend.buy = false;
  }

  if (this.trend.sell && this.trend.sellPrice == 0) {
    this.trend.sell = false;
  }

  if (this.settings.buy && this.settings.sell && this.settings.sellPrice <= this.settings.buyPrice) {
    this.trend.buy = false;
    this.trend.sell = false;
    log.debug("The sell price may not be below or equal to the buy price. Trade stopped");
    this.trend.completed = true;
  }
}

// What happens on every new candle?
strat.update = function (candle) {
  if (!this.trend.completed) {
    log.debug("Updating Strategy");
    // log.debug("Updating Strategy:" + JSON.stringify(candle));
    this.trend.currentValue = candle.close;
    log.debug("Current Value:" + this.trend.currentValue);
    log.debug("Current Stop Value:", this.trend.stopValue);
    log.debug("Highest Value:", this.trend.highestValue);

    if (this.trend.currentValue >= this.trend.highestValue) {
      log.debug("New highest value");

      if (this.trend.highestValue == 0) {
        this.configureFirstRun(this.settings, this.trend);
      }
      else {
        //
        if (this.settings.buy && this.trend.purchased && this.settings.movingStopValue || !this.settings.buy && this.settings.movingStopValue) {
          this.trend.stopValue = this.trend.currentValue - this.settings.trailingValueIncrement;
          log.debug("Updating StopValue to " + this.trend.stopValue);
        }

        this.trend.highestValue = this.trend.currentValue;
        log.debug("Highest Value:" + this.trend.highestValue);
      }
    }
  }
}

// For debugging purposes.
strat.log = function () {
  if (!this.trend.completed) {
    // log.debug("Logging Strategy");
    // log.debug(this);
  }
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function () {
  if (!this.trend.completed) {
    log.debug("Checking Strategy");
    log.debug("Completed: " + this.trend.completed);

    if (this.shouldSell(this.settings, this.trend)) {
      this.advice("short");
      this.trend.completed = true;

      log.debug(">>>>>Selling @", this.trend.currentValue);
      log.debug("Profit:", (this.trend.currentValue - this.settings.buyPrice));
      log.debug("Trading Finished");
      return;
    }
    else if (this.shouldBuy(this.settings, this.trend)) {
      this.advice("long");

      if (this.settings.movingStopValue) {
        // Trade starts here, reset stop value
        this.trend.stopValue = this.trend.currentValue - this.settings.trailingValueIncrement;
        log.debug("Updating StopValue to " + this.trend.stopValue);
      }

      this.trend.purchased = true;
      log.debug(">>>>>buying @", this.trend.currentValue);
      return;
    }
    else {
      log.debug("No Action");
    }
  }

  this.advice();
}

strat.configureFirstRun = function (settings, trend) {
  log.debug("First Run");

  if (settings.initialStopValue == 0) {
    log.debug("No initial stop value configured");
    if (settings.buyPrice > 0) {
      log.debug("Use configured buy price as bases for stop price");
      trend.stopValue = settings.buyPrice - settings.trailingValueIncrement;

      if (!settings.buy) {
        log.debug("Stock was bought on trading platform previously. We will still be able to sell and apply the stop order");
        if (settings.buyPrice > trend.currentValue) {
          trend.highestValue = settings.buyPrice;
          log.debug("New Highest Value:", settings.buyPrice);
        }
        else {
          trend.highestValue = trend.currentValue;
        }
      }
      else
      {
        trend.highestValue = trend.currentValue;        
      }
    }
    else {
      log.debug("Use last close value as bases for stop price");
      if (!settings.buy && settings.movingStopValue) {
        trend.stopValue = trend.currentValue - settings.trailingValueIncrement;
      }
    }

    log.debug("New StopValue:" + trend.stopValue);
  }
  else {
    log.debug("Use configured initial stop value");
    trend.stopValue = settings.initialStopValue;
    log.debug("New StopValue:" + settings.initialStopValue);

    if (!settings.buy && settings.buyPrice > 0) {
      log.debug("Stock was bought on trading platform previously. We will still be able to sell and apply the stop order");
      if (settings.buyPrice > trend.currentValue) {
        trend.highestValue = settings.buyPrice;
        log.debug("New Highest Value:", settings.buyPrice);
      }
      else {
        trend.highestValue = trend.currentValue;
      }
    }
  }

  if (settings.buy) {
    trend.initialMarketValueHigherThanBuyPrice = trend.currentValue > settings.buyPrice;
    log.debug("InitialMarketValueHigherThanBuyPrice:" + trend.initialMarketValueHigherThanBuyPrice);
  }

}


strat.shouldSell = function (settings, trend) {
  return (!this.settings.buy && this.trend.currentValue <= this.trend.stopValue) ||
    (this.settings.buy && this.trend.purchased && this.trend.currentValue <= this.trend.stopValue) ||
    (!this.settings.buy && this.settings.sell && this.trend.currentValue >= this.settings.sellPrice) ||
    (this.settings.buy && this.trend.purchased && this.settings.sell && this.trend.currentValue >= this.settings.sellPrice);

}

strat.shouldBuy = function (settings, trend) {
  if (!trend.purchased && settings.buy) {
    if (!trend.initialMarketValueHigherThanBuyPrice) {
      return trend.currentValue >= settings.buyPrice;
    }
    else {
      return trend.currentValue <= settings.buyPrice;
    }
  }
  else {
    return false;
  }
}

module.exports = strat;
