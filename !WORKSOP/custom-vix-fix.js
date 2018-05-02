const math = require('mathjs')
const fetch = require('node-fetch')
const log = require('../core/log')
const Util = require('./util')
const Slack = require('./util/slack')

// Let's create our own strat
const strat = {}

// Prepare everything our method needs
strat.init = function() {
  this.input = 'candle'
  this.requiredHistory = this.tradingAdvisor.historySize
  this.candles = {closes: [], highs: [], lows: []}
  this.currentTrend = 'short'

  const {loadInitialCandles = false, pair = 'BTC-EUR', candleSize = 900} = this.settings
  if (loadInitialCandles) {
    setTimeout(() => this.loadInitialCandles(pair, candleSize), 1000 * (candleSize - 30))
  }
}

strat.loadInitialCandles = async function(pair, candleSize) {
  const history = await (await fetch(`https://api.gdax.com/products/${pair}/candles?granularity=${candleSize}`)).json()
  history.reverse().pop()
  history.forEach(([timestamp, low, high, open, close, volume]) => {
    this.candles.closes.push(close)
    this.candles.highs.push(high)
    this.candles.lows.push(low)
  })
}

strat.aggregateCandle = function(candle) {
  this.lastCandle = candle
  this.candles.closes.push(candle.close)
  this.candles.highs.push(candle.high)
  this.candles.lows.push(candle.low)
  while (this.candles.closes.length > 90) {
    this.candles.closes.shift()
    this.candles.highs.shift()
    this.candles.lows.shift()
  }

  candle.indicators = {}
  if (this.candles.closes.length > 71) {
    candle.indicators.vixFixBottom = getVixFix(this.candles, 'bottom')
    candle.indicators.vixFixTop = getVixFix(this.candles, 'top')
  }
  this.previousMACDHist = candle.indicators.macdHist
}

// What happens on every new candle?
strat.update = function(candle) {
  this.aggregateCandle(candle)
  if (!this.firstCandle) {
    this.firstCandle = candle
    this.notify(`[Gekko] Received first candle at ${candle.start}`)
  }
}

// For debugging purposes.
strat.log = function() {
  // log.debug(this.candles[this.candles.length - 1])
}

// Based on the newly calculated information, check if we should update or not.
strat.check = function() {
  const {open, high, low, close, indicators} = this.lastCandle
  const {vixFixBottom, vixFixTop, willr} = indicators
  if (vixFixBottom && vixFixTop) {
    const isBottom = vixFixBottom.vixFix > vixFixBottom.rangeHigh &&
      vixFixBottom.vixFix > vixFixBottom.upperDeviationBand
    const isTop = vixFixTop.vixFix > vixFixTop.rangeHigh &&
      vixFixTop.vixFix > vixFixTop.upperDeviationBand
    if (isBottom && !isTop) {
      this.advice('long')
      if (this.currentTrend === 'short') {
        this.lastBuyPrice = close
        this.notify(`[Gekko] Advised long at ${close} (${-Util.round2(Util.percent(close, this.lastSellPrice))})`)
      }
      this.currentTrend = 'long'
    } else if (isTop && !isBottom) {
      this.advice('short')
      if (this.currentTrend === 'long') {
        this.lastSellPrice = close
        this.notify(`[Gekko] Advised short at ${close} (${Util.round2(Util.percent(close, this.lastBuyPrice))})`)
      }
      this.currentTrend = 'short'
    }
  }
}

strat.notify = function(text) {
  const {slackNotification = false} = this.settings
  if (slackNotification) {
    Slack.notify(text)
  }
  log.debug(text)
}

function getVixFix ({closes, highs, lows}, type = 'bottom', options = {}) {
  const {
    lookbackPeriod = 22,
    bolingerBandLength = 20,
    bollingerBandStandardDeviationUp = 2, // min: 1, max: 5
    lookbackPeriodPercentileHigh = 50,
    highestPercentile = 0.85
  } = options
  const vixFix = closes
    .map((value, i) => Math[type === 'bottom' ? 'max' : 'min'](...closes.slice(i - lookbackPeriod + 1, i + 1)))
    .map((value, i) => (type === 'bottom' ? (value - lows[i]) : (highs[i] - value)) / value * 100)
    .slice(lookbackPeriod - 1)
  const deviation = math.std(vixFix.slice(-bolingerBandLength), 'biased') * bollingerBandStandardDeviationUp
  const upperDeviationBand = math.mean(vixFix.slice(-bolingerBandLength)) + deviation
  const rangeHigh = Math.max(...vixFix.slice(-lookbackPeriodPercentileHigh)) * highestPercentile
  return {
    vixFix: vixFix[vixFix.length - 1], upperDeviationBand, rangeHigh
  }
}

module.exports = strat
