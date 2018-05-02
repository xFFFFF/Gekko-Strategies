var config= require('../core/util.js').getConfig()
  ,log= require('../core/log.js')
  ,_= require('lodash')
  ,talib= require("talib-promise")
  ,settings= config['gannswing']

// Let's create our own method
var method = {}

// Prepare everything our method needs
method.init = function() {
  this.name = 'gannswing'

  // keep dedicated amount of historic data
  this.history = {
    low: [],
    high: [],
    open: [],
    close: [],
    wvf: [],
    buyPrice: 0
  }

  // VIX calculation results
  this.vix= {
    sdev: { outReal: [] },
    sma: { outReal: [] },
    trade: []
  }

  // Gann's Swing results
  this.swing= {
    lowma: { outReal: [] },
    highma: { outReal: [] },
    fastlowma: { outReal: [] },
    fasthighma: { outReal: [] },
    count: 0,
    sellcount: 0,
    buycount: 0,
    tradebuy: false,
    tradesell: false
  }

  this.trend = {
    direction: 'none',
    adviced: false
  };

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = config.tradingAdvisor.historySize
}

method.calculateVIX= function(candle, period) {
  // nested VIX calculation
  var calc_vix_sma= function() {
    sdev= this.vix.sdev.outReal[this.vix.sdev.outReal.length-1]
    midline= this.vix.sma.outReal[this.vix.sma.outReal.length-1]
    this.vix.lowerband= midline - sdev
    this.vix.upperband= midline + sdev
    this.vix.rangehigh= Math.max.apply(null, this.history.wvf)*0.85
    this.vix.rangelow= Math.max.apply(null, this.history.wvf)*1.01
    //
    l= this.history.wvf.length
    if(this.history.wvf[l-1] >= this.vix.upperband
      || this.history.wvf[l-1] >= this.vix.rangehigh) {
      this.vix.trade.push(0)
    } else {
      this.vix.trade.push(1)
    }
  }.bind(this)

  var vix_stddev= function(period) {
    return talib.execute({
      name: "STDDEV",
      inReal: this.history.wvf,
      startIdx: 0,
      endIdx: (this.history.wvf.length - 1),
      optInTimePeriod: period,
      optInNbDev: 1
    }).then((data) => {
      this.vix.sdev= data.result
    // log.debug(this.vix.sdev)
  })
  }.bind(this)

  var vix_sma= function(period) {
    return talib.execute({
      name: "SMA",
      inReal: this.history.wvf,
      startIdx: 0,
      endIdx: (this.history.wvf.length - 1),
      optInTimePeriod: period,
      optInNbDev: 1
    }).then((data) => {
      this.vix.sma= data.result
  })
  }.bind(this)

  // remove old data
  l= settings.swingperiod
  if(l < settings.period) l= settings.period

  if(this.history.close.length > l) {
    this.history.close.shift(); this.history.open.shift()
    this.history.low.shift(); this.history.high.shift()
    this.history.wvf.shift();
  }

  // add new data
  this.history.open.push(candle.open)
  this.history.close.push(candle.close)
  this.history.high.push(candle.high)
  this.history.low.push(candle.low)
  highest = Math.max.apply(null, this.history.close)
  this.history.wvf.push(((highest - candle.low) / highest) * 100)

  // calculate VIX
  return vix_stddev(period)
    .then(vix_sma(period)
      .then(calc_vix_sma()))
}

method.gannswing= function(candle, period) {
  var loma= function(period) {
    return talib.execute({
      name: "SMA",
      inReal: this.history.low,
      startIdx: 0,
      endIdx: this.history.low.length - 1,
      optInTimePeriod: period,
      optInNbDev: 1
    }).then((data) => {
      this.swing.lowma= data.result
  })
  }.bind(this)

  var hima= function(period) {
    return talib.execute({
      name: "SMA",
      inReal: this.history.high,
      startIdx: 0,
      endIdx: this.history.high.length - 1,
      optInTimePeriod: period,
      optInNbDev: 1
    }).then((data) => {
      this.swing.highma= data.result
  })
  }.bind(this)

  var fastloma= function(period) {
    return talib.execute({
      name: "SMA",
      inReal: this.history.low,
      startIdx: 0,
      endIdx: this.history.low.length - 1,
      optInTimePeriod: period/5,
      optInNbDev: 1
    }).then((data) => {
      this.swing.fastlowma= data.result
  })
  }.bind(this)

  var fasthima= function(period) {
    return talib.execute({
      name: "SMA",
      inReal: this.history.high,
      startIdx: 0,
      endIdx: this.history.high.length - 1,
      optInTimePeriod: period/5,
      optInNbDev: 1
    }).then((data) => {
      this.swing.fasthighma= data.result
  })
  }.bind(this)

  var calculateSMA= function(candle) {
    if(candle.close > this.swing.highma.outReal[1] * 0.998
      || (candle.close > this.swing.fasthighma.outReal[1]
        && candle.close >  this.swing.fastlowma.outReal[1] * 1.01
        && this.swing.fasthighma.outReal[1] > this.swing.highma.outReal[1])) {
      hld= 1
    }
    else if(candle.close < this.swing.lowma.outReal[1] / 0.998
      || (candle.close < this.swing.fastlowma.outReal[1]
        && candle.close < this.swing.fasthighma.outReal[1] / 1.01
        && this.swing.fastlowma.outReal[1] < this.swing.lowma.outReal[1])) {
      hld= -1
    }
    else { hld= 0 }

    if(hld != 0) this.swing.count++
    if(hld != 0 && this.swing.count == 1) {
      hlv= hld
      this.swing.count = 0
    } else { hlv = 0 }

    if(hlv == -1) {
      this.swing.sellcount++
      this.swing.buycount= 0
    }
    else if(hlv == 1) {
      this.swing.buycount++
      this.swing.sellcount= 0
    }

    if(this.swing.buycount == 3) {
      this.swing.buycount= 0
      this.swing.tradebuy= true
    }
    else { this.swing.tradebuy= false }
    if(this.swing.sellcount == 3) {
      this.swing.sellcount= 0
      this.swing.tradesell= true
    }
    else { this.swing.tradesell= false }
  }.bind(this)

  loma(period)
    .then(hima(period)
      .then(fastloma(period)
        .then(fasthima(period)
          .then(calculateSMA(candle))
        )))
}

// What happens on every new candle?
method.update = function(candle) {
  this.calculateVIX(candle, settings.vixperiod)
    .then(this.gannswing(candle, settings.swingperiod))
}

// For debugging purposes.
// For debugging purposes.
method.log = function() {
  log.debug('gannswing:    buycount: ' + this.swing.buycount
    + ' sellcount: ' + this.swing.sellcount);
  log.debug('              tradebuy: ' + this.swing.tradebuy
    + ' tradesell: ' + this.swing.tradesell);
  log.debug('              VIX t: ' + this.history.wvf[this.history.wvf.length-1]
    + ' VIX t-1: ' + this.history.wvf[this.history.wvf.length-2]);
}

// Based on the newly calculated information, check if we should
// update or not.
method.check = function(candle) {
  var price = this.candle.close;
  //log.debug('price = ', price);
  if(this.swing.tradebuy) {
    if(this.trend.direction !== 'long') {
      this.trend.adviced = false; this.trend.direction = 'long'
    }
    if(!this.trend.adviced) {
      this.trend.adviced = true
      this.history.buyPrice = price
      this.advice('long')
    }
    else this.advice()
  }

  wvf= this.history.wvf[this.history.wvf.length - 1]
  t1= this.vix.trade[this.vix.trade.length - 1]
  t2= this.vix.trade[this.vix.trade.length - 2]
  if((this.swing.tradesell && wvf < 2.85)
    || (this.swing.tradebuy && wvf > 8.5 && t1 == 1 && t2 == 0)) {
    if(this.trend.direction !== 'short') {
      this.trend.adviced= false; this.trend.direction= 'short'
    }
    if(!this.trend.adviced) {
      this.trend.adviced= true
      this.advice('short')
    }
    else this.advice()
  }

  if(this.checkStopLoss(price))
    log.debug('STOPLOSS sell @'+price)
}

method.checkStopLoss = function(price) {
  if(!settings.stoploss.enabled)
    return false
  if(this.trend.adviced && this.trend.direction === 'long') {
    //log.debug('history.buyPrice = ', this.history.buyPrice);
    sl = this.history.buyPrice * (1 - settings.stoploss.percent / 100)
    //log.debug('sl = ', sl);
    if(price < sl) {
      log.debug('stoploss triggered!');
      this.trend.direction= 'stoploss'
      this.duration= 0; this.trend.persisted= false
      this.advice('short');
      return true;
    }
    if(settings.stoploss.trailing && price > this.history.buyPrice) {
      this.history.buyPrice = price
      return false;
    }
  }
}

module.exports = method;
