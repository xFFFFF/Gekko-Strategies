analytics = require "forex.analytics"

forexUtils = require "./forex_utils"

strategy =

  init: ->
    config = require('../core/util.js').getConfig();
    @onlyGetIndicators = config.forex.mode is "getIndicators"
    if @onlyGetIndicators
      @indicatorValues = {}
    @valueFields = {}

    for id, indicatorConfig of config.forex.indicators
      unless indicatorConfig.talib?
        throw new Error ".talib missing"
      unless indicatorConfig.type?
        throw new Error ".type missing"

      if indicatorConfig.talib
        @addTalibIndicator id, indicatorConfig.type, indicatorConfig.settings
      else
        @addIndicator id, indicatorConfig.type, indicatorConfig.settings

      if @onlyGetIndicators
        @indicatorValues[id] = []
      @valueFields[id] = indicatorConfig.value

    if @onlyGetIndicators
      return

    @strategy = config.forex.strategy
    @advices = []

  update: (candle) ->
#    @history.push forexUtils.gekko2forexCandle candle
#    if @history.length > @requiredHistory
#      @history = @history[@history.length-@requiredHistory..]

  log: (candle) ->
    #console.log "log", candle

  check: (candle) ->
    #console.log "check", candle


    thisIndicators = {}
    for name, indicator of @indicators
      thisIndicators[name] = [indicator[@valueFields[name]]]
      if @onlyGetIndicators
        @indicatorValues[name].push thisIndicators[name][0]

    for name, indicator of @talibIndicators
      thisIndicators[name] = [indicator[@valueFields[name]]]
      if @onlyGetIndicators
        @indicatorValues[name].push thisIndicators[name][0]

    if @onlyGetIndicators or not Object.keys(@indicators).length
      return

    result = analytics.getMarketStatus thisIndicators,
      strategy: @strategy

    #console.log "check #{@history.length}/#{@requiredHistory}"
    #console.log result
    @advices.push
      at: candle.end
      shouldBuy: result.shouldBuy
      shouldSell: result.shouldSell

    if result.shouldSell and result.shouldBuy
      #console.log "shouldSell and shouldBuy"
      @advice()
    else if result.shouldSell
      #console.log "shouldSell"
      @advice "short"
    else if result.shouldBuy
      #console.log "shouldBuy"
      @advice "long"
    else
      @advice()

module.exports = strategy;
