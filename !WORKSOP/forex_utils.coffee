module.exports =
  gekko2forexCandle: (candle) ->
    open: candle.open
    high: candle.high
    low: candle.low
    close: candle.close
    time: candle.start / 1000


  getUnknownIndicators: (indicators) ->
    unknownIndicators = []

    for indicator in indicators
      unless @availableIndicators.includes indicator
        unknownIndicators.push indicator

    unknownIndicators

  availableIndicators: [
    'ATR'
    'BOP'
    'CCI'
    'MACD'
    'MACD_Signal'
    'MACD_Histogram'
    'Momentum'
    'RSI'
    'SAR'
    'SMA15_SMA50'
    'Stochastic'
  ]
