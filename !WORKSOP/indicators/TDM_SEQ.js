/*
 * Tom DeMark's Sequential indicator
 *
 * The return variable is an object with following properties:
 *
 * numCountdowns: Number of countdowns found so far (integer)
 * lastCdType: Last countdown type. Can be 'buy' or 'sell' (string)
 * lastCdPerfectSetup: A boolean flag indicating whether last countdown had a perfect setup. (boolean)
 *
 */

var Indicator = function() {
  this.histData = [];
  this.histMax = 20;
  this.state = 'none';
  this.perfectSetup = null;
  this.countdownCandles = null;
  this.countdownCandleEight = null;
  this.stateToNone();
  this.result = {numCountdowns: 0, lastCdType: null, lastCdPerfectSetup: null};
//  console.log('TDM_SEQ(i): Created an indicator');
};

Indicator.prototype.update = function(candle) {
  this.addToHistory(candle);
  this.updateFromHistory();
};

Indicator.prototype.addToHistory = function(candle) {
  this.histData.unshift(candle);
  if (this.histData.length > this.histMax) {
    this.histData.pop();
  }
//  console.log('TDM_SEQ(i): Added a candle:', JSON.stringify(candle));
};

Indicator.prototype.updateFromHistory = function() {
/*
  console.log(
    'TDM_SEQ(i): Variables before candle',
    JSON.stringify({state: this.state, perfectSetup: this.perfectSetup, countdownCandles: this.countdownCandles})
  );
*/
  for (;;) {
    if (this.updateAttempt()) {
      break;
    }
    this.stateToNone();
  }
/*
  console.log(
    'TDM_SEQ(i): Variables after candle',
    JSON.stringify({state: this.state, perfectSetup: this.perfectSetup, countdownCandles: this.countdownCandles})
  );
*/
};

Indicator.prototype.updateAttempt = function() {
  switch (this.state) {
  case 'none':
    if (this.checkBuySetup()) {
//      console.log('TDM_SEQ(i): Found a buy setup');
      this.state = 'buy_countdown';
      this.countdownCandles = 0;
      this.perfectSetup = Math.min(this.histData [0].low, this.histData [1].low) < Math.min(this.histData [2].low, this.histData [3].low);
    } else if (this.checkSellSetup()) {
//      console.log('TDM_SEQ(i): Found a sell setup');
      this.state = 'sell_countdown';
      this.countdownCandles = 0;
      this.perfectSetup = Math.max(this.histData [0].high, this.histData [1].high) > Math.min(this.histData [2].high, this.histData [3].high);
    }
    return (true);
  case 'buy_countdown':
    if (this.checkSellSetup()) {
//      console.log('TDM_SEQ(i): Canceling buy countdown because of a sell setup');
      this.stateToNone();
      return (false);
    }
    if (this.histData [0].close <= this.histData [2].low) {
      ++this.countdownCandles;
    }
    if (this.countdownCandles == 8) {
      this.countdownCandleEight = this.histData [0];
    }
    if ((this.countdownCandles >= 13) && (this.histData [0].low <= this.countdownCandleEight.close)) {
      this.addCountdownToResult('buy');
      this.stateToNone();
    }
    return (true);
  case 'sell_countdown':
    if (this.checkBuySetup()) {
//      console.log('TDM_SEQ(i): Canceling sell countdown because of a buy setup');
      this.stateToNone();
      return (false);
    }
    if (this.histData [0].close >= this.histData [2].high) {
      ++this.countdownCandles;
    }
    if (this.countdownCandles == 8) {
      this.countdownCandleEight = this.histData [0];
    }
    if ((this.countdownCandles >= 13) && (this.histData [0].high >= this.countdownCandleEight.close)) {
      this.addCountdownToResult('sell');
      this.stateToNone();
    }
    return (true);
  default:
//    console.log('TDM_SEQ(i): Unknown state', this.state);
    this.stateToNone();
    return (false);
  }
};

Indicator.prototype.checkBuySetup = function() {
  var i;

  if (this.histData.length < 13) {
    return (false);
  }
  for (i = 0; i < 9; ++i) {
    if (this.histData [i].close >= this.histData [i+4].close) {
        return (false);
    }
  }
  return (true);
};

Indicator.prototype.checkSellSetup = function() {
  var i;

  if (this.histData.length < 13) {
    return (false);
  }
  for (i = 0; i < 9; ++i) {
    if (this.histData [i].close <= this.histData [i+4].close) {
        return (false);
    }
  }
  return (true);
};

Indicator.prototype.stateToNone = function() {
  this.state = 'none';
  this.perfectSetup = null;
  this.countdownCandles = null;
  this.countdownCandleEight = null;
};

Indicator.prototype.addCountdownToResult = function(type) {
  ++this.result.numCountdowns;
  this.result.lastCdType = type;
  this.result.lastCdPerfectSetup = this.perfectSetup;
};

module.exports = Indicator;
