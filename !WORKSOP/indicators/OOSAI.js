/*
 * CCI
 */
var log = require('../../core/log');
var _ = require('lodash');

//현재는 gekko 가 최소 1분 이하로는 봉 정보를 보내주지 않는다 따라서 1분마다 봉정보를 수신하여 처리
var Indicator = function (settings) {
  this.reset();
  this.settings = settings;
  this.settings_candle_duration = settings.candle_duration;
  this.target_profit = this.settings.sell.condition.target_profit;
  this.sub_target_profit = this.settings.sell.condition.sub_target_profit;
}

Indicator.prototype.reset = function () {
  this.candleHistories = [];
  this.history = {
    snapshot: {
      price: 0,
      index: 0,
      prev_candle1_low: 0
    },
    stage1: {
      avgvol: 0,
      warning1: false,
      warning2: false
    }
  }
}

Indicator.prototype.isBoundary = function () {
  return _.size(this.candleHistories) % this.settings_candle_duration === 0;
}

Indicator.prototype.update = function (candle) {
  this.candleHistories.push(candle);
}

Indicator.prototype.getStage = function () {
  let last_index = _.size(this.candleHistories) - 1;
  let t = last_index - this.history.snapshot.index + 1;
  return Math.trunc(t / this.settings_candle_duration) + 1;
}

Indicator.prototype.snapshotLong = function (kase, price) {
  let prev_result = this.getCandleSummaryBySize(this.settings_candle_duration * 3);
  this.history.snapshot.price = price;
  this.history.snapshot.kase = kase;
  this.history.stage1.avgvol = prev_result.avgvol;
}

Indicator.prototype.calcIndex = function () {
  let size_of_histories = _.size(this.candleHistories);
  let age = size_of_histories % this.settings_candle_duration;
  let age_offset = size_of_histories - age;
  let start = size_of_histories - (age + this.settings.buy.condition.case1.prev_candle_count * this.settings_candle_duration);
  let end = size_of_histories % this.settings_candle_duration;
  return {
    start: start,
    age: age,
    age_offset: age_offset,
    end: size_of_histories,
    size: size_of_histories
  }
}
/**
 * age_offset 이전 size 봉 만큼의 봉 요약 정보
 */
Indicator.prototype.getCandleSummaryBySize = function (size) {
  let indexResult = this.calcIndex();
  // console.log('indexResult1',indexResult);
  let start = indexResult.age_offset - size;
  let end = indexResult.age_offset;
  let result = this.candleRangeSummary(this.candleHistories, start, end);
  return result;
}

/**
 * 봉이 완료되기 전까지 현재 봉 요약 정보
 */
Indicator.prototype.getCurrentCandleSummary = function () {
  let indexResult = this.calcIndex();
  // console.log('indexResult2',indexResult);
  // if (indexResult.age_offset == indexResult.end) {
  //   indexResult.age_offset -= this.settings_candle_duration;
  // }
  let result = this.candleRangeSummary(this.candleHistories, indexResult.age_offset, indexResult.end);
  return result;
}

Indicator.prototype.checkBuyCondition1 = function (candle) {
  let cond0 = _.size(this.candleHistories) > this.settings_candle_duration * this.settings.buy.condition.case1.prev_candle_count;
  if(!cond0) return false;
  
  //양봉일 때만, 음봉이면 false
  let up_candle = this.settings.buy.condition.case1.up_candle;
  let isUpCandle = candle.close > candle.open;
  if(!up_candle) {
    isUpCandle = candle.close < candle.open;
  } 
  
  //1-1. 30봉 open 가격 < 현재 가격
  let before_result1 = this.getCandleSummaryBySize(this.settings_candle_duration);
  //1-2 (이전 {3}개 봉의 평균거래량)x{3} < 현재 실시간 거래량
  let prev_candle_count = this.settings.buy.condition.case1.prev_candle_count;
  let before_result2 = this.getCandleSummaryBySize(this.settings_candle_duration * prev_candle_count);
  let current_result2 = this.getCurrentCandleSummary();
  let prev_volume_surge_ratio = this.settings.buy.condition.case1.prev_volume_surge_ratio;
  let cond2 = before_result2.avgvol * prev_volume_surge_ratio < current_result2.avgvol;
  //1-3. 이전 {3}개봉의 평균가격(각 봉의(open+close)/2의 평균)보다 {1%}이상 상승)
  const prev_price_surge_ratio = this.settings.buy.condition.case1.prev_price_surge_ratio;
  let cond3 = before_result2.avgoc < current_result2.avgoc + current_result2.avgoc * prev_price_surge_ratio;
  let result = isUpCandle && cond2 && cond3;
  if (result) {
    this.history.snapshot.prev_candle1_low = before_result1.low;
  }
  console.log(`buy1: ${cond0},${isUpCandle},${cond2},${cond3}`);
  return result;
}

Indicator.prototype.checkBuyCondition2 = function (candle) {
  let prev_max_num_candle = this.settings.buy.condition.case2.prev_max_num_candle;
  let cond0 = _.size(this.candleHistories) > this.settings_candle_duration * prev_max_num_candle;
  if(!cond0) return false;
  //양봉일 때만, 음봉이면 false
  let up_candle = this.settings.buy.condition.case2.up_candle;
  let isUpCandle = candle.close > candle.open;
  if(!up_candle) {
    isUpCandle = candle.close < candle.open;
  } 
  //2-1. 30봉 open 가격 < 현재 가격
  let before_result1 = this.getCandleSummaryBySize(this.settings_candle_duration);
  
  //2-2. (이전 {3}개 봉의 평균거래량)x {5배} < 현재 실시간 거래량
  let prev_volume_surge_ratio2 = this.settings.buy.condition.case2.prev_volume_surge_ratio2;
  let before_result2 = this.getCandleSummaryBySize(this.settings_candle_duration * prev_volume_surge_ratio2);
  let current_result2 = this.getCurrentCandleSummary();
  let cond2 = before_result2.avgvol * 5 < current_result2.avgvol;
  //2-3. 이전 {10}개봉의 최고가격 < 현재가
  let before_result3 = this.getCandleSummaryBySize(this.settings_candle_duration * prev_max_num_candle);
  let cond3 = before_result3.high < current_result2.close;
  console.log(`buy2: ${cond0},${isUpCandle},${cond2},${cond3}`);
  let result = isUpCandle && cond2 && cond3;
  if (result) {
    this.history.snapshot.prev_candle1_low = before_result1.low;
  }
  console.log(`buy2: ${isUpCandle},${cond2},${cond3}`);
  return result;
}

//현재 가격이 이전에 산 가격보다 목표치 이상 높으면 true,(매도)
Indicator.prototype.checkSellCondition1 = function (candle) {
  let currentPrice = candle.close; //현재 가격
  let buyPrice = this.history.snapshot.price; //이전에 산 가격
  //2번봉 저점, 즉 바로 전 30분 봉의 저점 보다 현재가가 낮으면 매도
  let cond0 = currentPrice < this.history.snapshot.prev_candle1_low;
  console.log('cond0',cond0);
  if (cond0) {
    return true;
  }
  //-2% 손실 시 손절
  let cond1 = currentPrice < buyPrice - buyPrice * this.settings.sell.condition.loss_ratio;
  console.log('cond1',cond1);
  if (cond1) {
    return true;
  }
  //음봉이면서 거래량이 3배이상
  let isDownCandle = candle.open > candle.close;
  let prev_candle_count = this.settings.sell.condition.case1.prev_candle_count;
  let before_result2 = this.getCandleSummaryBySize(this.settings_candle_duration * prev_candle_count);
  let current_result2 = this.getCurrentCandleSummary();
  let prev_volume_surge_ratio = this.settings.sell.condition.case1.prev_volume_surge_ratio;
  let cond2 = before_result2.avgvol * 3 < current_result2.avgvol;
  // if(isDownCandle && cond2) {
  //   return true;
  // }
  console.log('sell!',`${currentPrice},${buyPrice}`)
  if (currentPrice > buyPrice + buyPrice * this.settings.sell.condition.range1.a) {
    if (currentPrice < buyPrice + buyPrice * this.settings.sell.condition.range1.b) {
      let minProfit = this.settings.sell.condition.range1.a * this.settings.sell.condition.range1.c;
      if (currentPrice < buyPrice + buyPrice * minProfit) {
        return true;
      }
    } else if (currentPrice < buyPrice + buyPrice * this.settings.sell.condition.range2.b) {
      let minProfit = this.settings.sell.condition.range2.a * this.settings.sell.condition.range2.c;
      if (currentPrice < buyPrice + buyPrice * minProfit) {
        return true;
      }
    } else if (currentPrice < buyPrice + buyPrice * this.settings.sell.condition.range3.b) {
      let minProfit = this.settings.sell.condition.range3.a * this.settings.sell.condition.range3.c;
      if (currentPrice < buyPrice + buyPrice * minProfit) {
        return true;
      }
    }
  } 
  return false;
}

Indicator.prototype.candleRangeSummary = function (candleHistories, start, end) {
  if (start == end) {
    // throw new Error(`start should not equal end:${start},${end}`);
    start = end-30;
  }
  var candles = candleHistories.slice(start, end);
  console.log('candles!!!',_.size(candles),start,end);
  var size = _.size(candles);
  var result = _.reduce(candles,
    function (candle, m) {
      candle.high = _.max([candle.high, m.high]);
      candle.low = _.min([candle.low, m.low]);
      candle.volume += m.volume;
      candle.vwp += m.vwp * m.volume;
      candle.trades += m.trades;
      candle.sumoc += m.open + m.close;
      return candle;
    }, {
      high: Number.MIN_VALUE,
      low: Number.MAX_VALUE,
      volume: 0,
      vwp: 0,
      trades: 0,
      sumoc: 0,
      avgvol: 0,
      size: 0,
      avgoc: 0
    }
  );
  result.avgvol = result.volume / size;
  result.open = _.first(candles).open;
  result.close = _.last(candles).close;
  result.size = size;
  result.avgoc = result.sumoc / size;
  return result;
}

module.exports = Indicator;
