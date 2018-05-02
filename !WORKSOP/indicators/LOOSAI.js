var _ = require('lodash');

var Indicator = function (settings) {
  this.settings = settings;
  this.candles = [];
  this.candlesIndex = 0; //log 용
  this.groupCandles = []; //candle_duration 동안의 요약정보를 저장
  this.buy = {};
  this.sell = {
    flow: '0',
    profit : 0
  }
  this.canBuy = true;
}
Indicator.prototype.sizeOfCandles = function () {
  return _.size(this.candles);
}
Indicator.prototype.addCandle = function (c) {
  this.candlesIndex++;
  this.candles.push(c);
}
Indicator.prototype.update = function (candle) {}
Indicator.prototype.canApplyToCase1 = function () {
  let prev_candle_count = this.settings.buy.condition.case1.prev_candle_count;
  return this.candles.length > 0 && this.groupCandles.length >= prev_candle_count;
}
Indicator.prototype.isUpCandle = function (c) {
  return c.open <= c.close;
}
Indicator.prototype.isDownCandle = function (c) {
  return !this.isUpCandle();
}
Indicator.prototype.getOffset = function () {
  let candle_duration = this.settings.candle_duration;
  return this.candles.length % candle_duration;
}
Indicator.prototype.recordable = function () {
  let candle_duration = this.settings.candle_duration;
  return this.candles.length > 0 && (this.candles.length % candle_duration === 0)
}

Indicator.prototype.record = function () {
  if (this.recordable()) {
    let candle_duration = this.settings.candle_duration;
    let summary = getCandleSummary(_.last(this.candles, candle_duration));
    //현재는 총 10개 이상 요약 정보는 저장할 필요 없음
    let capacity = this.settings.buy.condition.case2.prev_max_num_candle;
    if (this.groupCandles.length > capacity) {
      this.groupCandles.shift();
    }
    this.groupCandles.push(summary);
    //groupCandles 에 저장한 후 this.candles 은 삭제한다. 최대 5개만 유지
    delete this.candles;
    this.candles = [];
  }
}

//1) {양봉}
//2) A = {30}분봉 기준
//3) B = {3}개 봉의 평균 거래량, C = {3}배 이상 4) D = {1.001}배 상승
Indicator.prototype.matchBuyCase1 = function () {
  let use = this.settings.buy.condition.case1.use;
  if(!use)
    return false;
  // 30 분이 세 개 이상이고, 현재 candle unit 이 한 개 이상이어야 가능
  let capacity = this.settings.buy.condition.case1.prev_candle_count;
  if (this.groupCandles.length < capacity) return false;
  //양봉 확인
  let c = _.last(this.candles);
  let isUpCandle = this.isUpCandle(c);

  //최소 btc 이상 거래량
  let current_btc_volume = c.volume * c.close;
  let isGreaterThanMinVol = current_btc_volume > this.settings.buy.condition.case1.min_base_vol;

  //3 은 이 전 30분 봉 세 개
  //30분봉 기준 이전 세 개 요약
  let groupSummary = this.getCandleGroupSummary(3);
  //현재 봉 기준 이전 세 개 요약
  let unitSummary = getCandleSummary(this.candles);
  //거래량 3배 확인 groupcandles 를 통해서
  const prev_volume_surge_ratio = this.settings.buy.condition.case1.prev_volume_surge_ratio;
  let isVolumeUp = unitSummary.avgvol > groupSummary.avgvol * prev_volume_surge_ratio;
  //1.01 % 이상
  const prev_price_surge_ratio = this.settings.buy.condition.case1.prev_price_surge_ratio;
  let isPriceUp = unitSummary.close * prev_price_surge_ratio > groupSummary.avgoc;
  return isUpCandle && isGreaterThanMinVol && isVolumeUp && isPriceUp;
}

// 1) {양봉}
// 2) A = {30}분봉 기준
// 3) B = {3}개 봉의 평균 거래량, C = {2}배 이상
// 4) E = {10}개의 봉 중에 최고 가격과 비교하여 고점 돌파 여부를 찾음.
Indicator.prototype.matchBuyCase2 = function () {
  let use = this.settings.buy.condition.case2.use;
  if(!use)
    return false;
  // 30 분이 세 개 이상이고, 현재 candle unit 이 한 개 이상이어야 가능
  let capacity = this.settings.buy.condition.case2.prev_max_num_candle;
  if (this.groupCandles.length < capacity) return false;
  //양봉 확인
  let c = _.last(this.candles);
  let isUpCandle = this.isUpCandle(c);
  //3 은 이 전 30분 봉 세 개
  //30분봉 기준 이전 세 개 요약
  let groupSummary = this.getCandleGroupSummary(capacity);
  //현재 봉 기준 이전 세 개 요약
  let unitSummary = getCandleSummary(this.candles);
  //거래량 2배 확인 groupcandles 를 통해서
  const prev_volume_surge_ratio = this.settings.buy.condition.case2.prev_volume_surge_ratio2;
  let isVolumeUp = unitSummary.avgvol > groupSummary.avgvol * prev_volume_surge_ratio;
  //이전 10개 봉 최고점 이상
  let isPriceUp = unitSummary.close > groupSummary.high;
  return isUpCandle && isVolumeUp && isPriceUp;
}
//구매 후 호출할 함수
Indicator.prototype.snapshotBuy = function () {
  this.buy = _.last(this.candles);
  console.log(`buy ${this.buy.close}, ${this.buy.low}`);
  //reset candles;
  this.resetCandles();
  this.canBuy = false;
}
//판매 후 호출할 함수
Indicator.prototype.snapshotSell = function () {
  let c = _.last(this.candles);
  console.log(`sell ${c.close}, ${c.low}`);
  this.resetCandles();
  this.sell = {
    flow: '0',
    profit : 0
  }
  this.canBuy = true;
}
Indicator.prototype.resetCandles = function () {
  delete this.candles;
  this.candles = [];
  delete this.groupCandles;
  this.groupCandles = [];
}

Indicator.prototype.matchSellCase = function () {
  if (this.candles.length == 0) {
    return false;
  }
  let currentCandle = _.last(this.candles);
  let currentPrice = currentCandle.close;
  let buyPrice = this.buy.close;
  if (this.sell.profit == 0 && buyPrice > currentPrice) { //손절해야하나?
    let useCase1 = this.settings.sell.condition.case1.use;
    let useCase2 = this.settings.sell.condition.case2.use;
    //case1 매수 시점 이 후로 30분봉 완성 후 감시
    let nth_candle = this.settings.sell.condition.case1.nth_candle;
    let lowPrice = this.buy.low; // {K} 0번봉(현재봉, 매수시점의 봉) 저점 미만시 매도
    let current_btc_volume = currentCandle.volume * currentCandle.close;
    let isGreaterThanMinVol1 = current_btc_volume > this.settings.sell.condition.case1.min_base_vol;
    let isGreaterThanMinVol2 = current_btc_volume > this.settings.sell.condition.case2.min_base_vol;
    let isGreaterThanMinVol3 = current_btc_volume > this.settings.sell.condition.case3.min_base_vol;
    if(nth_candle > 0) {
      if(this.groupCandles.length > nth_candle-1) {
        lowPrice = this.groupCandles[nth_candle-1].low;
      }
    }
    if (useCase1 && isGreaterThanMinVol1 && lowPrice > currentCandle.close) {
      console.log(`case1: 현재 봉 low 보다 매수가격이 아래여서 손절,손절가!:  ${currentPrice}, ${this.buy.low}`);
      return true;
    }
    //case 2
    if (useCase2 && isGreaterThanMinVol2 && this.buy.close * this.settings.sell.condition.case2.loss_ratio > currentCandle.close) {
      console.log(`case2: 손실 -2% 미만이라 손절,손절가!: ${currentCandle.close}`);
      return true;
    }
  } else { //익절해야하나.
    let useCase3 = this.settings.sell.condition.case3.use;
    let current_btc_volume = currentCandle.volume * currentCandle.close;
    let isGreaterThanMinVol3 = current_btc_volume > this.settings.sell.condition.case3.min_base_vol;
    if(!useCase3) return false;
    if(this.sell.profit == 0) {
      if (currentPrice > buyPrice * this.settings.sell.condition.case3.range1.a) {
        if (currentPrice <= buyPrice * this.settings.sell.condition.case3.range2.a) {
          this.sell.flow = '1';
        } else if (currentPrice <= buyPrice * this.settings.sell.condition.case3.range3.a) {
          this.sell.flow = '2';
        } else {
          this.sell.flow = '3';
        }
        this.sell.profit = currentPrice;
        return false;
      } 
    } else {
      if (this.sell.flow == '1') {
        let minProfit = (this.settings.sell.condition.case3.range1.a - 1) * (1 - this.settings.sell.condition.case3.range1.b);
        if (isGreaterThanMinVol3 && currentPrice < this.sell.profit + this.sell.profit * minProfit) {
          let profit = (currentPrice-this.buy.close)/this.buy.close;
          console.log(`case3-1: 익절: ${profit}`);
          return true;
        }
      } else if (this.sell.flow == '2') {
        let minProfit = (this.settings.sell.condition.case3.range2.a - 1) * (1 - this.settings.sell.condition.case3.range2.b);
        if (isGreaterThanMinVol3 && currentPrice < this.sell.profit + this.sell.profit * minProfit) {
          let profit = (currentPrice-this.buy.close)/this.buy.close;
          console.log(`case3-2: 익절: ${profit}`);
          return true;
        }
      } else {
        let minProfit = (this.settings.sell.condition.case3.range3.a - 1) * (1 - this.settings.sell.condition.case3.range3.b);
        if (isGreaterThanMinVol3 && currentPrice < this.sell.profit + this.sell.profit * minProfit) {
          let profit = (currentPrice-this.buy.close)/this.buy.close;
          console.log(`case3-3: 익절: ${profit}`);
          return true;
        }
      }
    } 
  }

  return false;
}

/**
 * groupSizeToPick: 가져올 groupcandle 의 수, 3 이면 최근 30분봉 3개를 가져온다.
 */
Indicator.prototype.getCandleGroupSummary = function (groupSizeToPick) {
  let candles = _.last(this.groupCandles, groupSizeToPick);
  let candle_duration = this.settings.candle_duration;
  return getCandleSummary(candles, candle_duration)
}

function getCandleSummary(candles, candleDuration) {
  let candleSize = candleDuration || 1;
  var result = _.reduce(candles,
    function (candle, m) {
      candle.high = _.max([candle.high, m.high]);
      candle.low = _.min([candle.low, m.low]);
      candle.volume += m.volume;
      candle.sumoc += m.open + m.close;
      return candle;
    }, {
      high: Number.MIN_VALUE,
      low: Number.MAX_VALUE,
      volume: 0,
      sumoc: 0
    }
  );
  //group candle의 경우 이미 계산된 avgvol 을 쓴다. 아래 로직 변경시 test fail.
  result.avgvol = result.volume / (candles.length * candleSize);
  result.open = _.first(candles).open;
  result.close = _.last(candles).close;
  result.avgoc = result.sumoc / (candles.length * 2); //2 => open, close
  return result;
}

module.exports = Indicator;
module.exports.getCandleSummary = getCandleSummary;
