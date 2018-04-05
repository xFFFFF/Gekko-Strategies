/**
 * CandlesPatterns
 *
 * Detect classical patterns of candles :
 * - Doji
 * - DragonflyDoji
 * - EveningStar
 * - LongLowerShadow
 * - LongUpperShadow
 * - GravestoneDoji
 * - Hammer
 * - HangingMan
 * - HaramiDown
 * - HaramiUp
 * - LongLeggedDoji
 * - Marubozu
 * - MorningStar
 * - SpinningTop
 * - Star
 *
 * The indicator return a trend.
 * - 'indicator.result' is the trend (>0 go up, <0 go down, 0 unknown)
 * - 'indicator.name' is the name of detected pattern or undefined.
 * - 'indicator.hist[x].pattern.result' is the name of a specific candle in history
 *
 * To detect a 'doji', 'small' or 'big' the algorithm must calculate the scale
 * of the currents candles. The parameter 'scaleMaxSize' indicate the maximum
 * last candle to keep in history to calculate the median.
 * You can change the coefficient to use.
 *
 * @see https://www.abcbourse.com/apprendre/10_chgt_tendance_1.html (french)
 * @see http://stockcharts.com/school/doku.php?id=chart_school:chart_analysis:introduction_to_candlesticks
 * @author Philippe Prados
 */

var log = require('../../core/log');
var assert = require('assert');
const debug=false;
var nbdebug=0;
var pickLog=1;

var Indicator = function(settings) {
  assert(settings != undefined,"Add settings");
  this.settings=settings;
  this.name = undefined;
  this.result=0;    // >0 : long ; <0 : short
  this.maxSize = 3; // History for the bigger patterns
  this.resetHistory();
  for (var i = 0; i < this.maxSize; i++)
      this.hist.push(0.0);
};

Indicator.prototype.resetHistory=function() {
  this.hist=[];
  this.size=0;
  this.resetScale();
};
Indicator.prototype.resetScale=function() {
  this.scales=[];
  this.scaleSize=0;
  this.scale=0;
};

Indicator.prototype.buildWithPattern = function(candle) {
  return {
    candle:candle,
    pattern: {
      direction: candle.close-candle.open, // >0 up, <0 down, 0 unknown
      realBody: Math.abs(candle.close-candle.open), // Taille du corps
      upperShadow: Math.abs(candle.high-Math.max(candle.open,candle.close)),
      lowerShadow: Math.abs(Math.min(candle.open,candle.close)-candle.low),
      body:candle.high-candle.low,
      type:undefined,
      average:(candle.high+candle.close+candle.open+candle.close)/4,
    },
  }
};

Indicator.prototype.last=function() {
  return this.hist[this.size-1];
};

Indicator.prototype.update = function(candle) {

  // We need sufficient history to get the right result.
  assert.equal(true,(candle.low <= candle.open) && (candle.low <= candle.close) && (candle.low <= candle.high),
    "Bad low value in candle");
  assert.equal(true,(candle.high >= candle.open) && (candle.high >= candle.close) && (candle.high >= candle.low),
    "bad high value in candle");
  var withPattern=this.buildWithPattern(candle);

  // Manage history of patterns
  if (this.size < this.maxSize) {
    this.hist[this.size] = withPattern;
    this.size++;
  } else {
    for (var i = 0; i < this.maxSize-1; i++) {
      this.hist[i] = this.hist[i+1];
    }
    this.hist[this.maxSize-1] = withPattern;
  }

  // Manage Scale
  if (withPattern.pattern.body > 0) {
    if (this.scaleSize < this.settings.scaleMaxSize) {
      this.scales[this.scaleSize] = withPattern.pattern.body;
      this.scaleSize++;
    } else {
      for (var i = 0; i < this.settings.scaleMaxSize-1; i++) {
        this.scales[i] = this.scales[i+1];
      }
      this.scales[this.settings.scaleMaxSize-1] = withPattern.pattern.body;
    }
    // Median
    if (this.settings.strategy === 'median')
    {
      var sortedScale=this.scales.slice(0).sort();
      this.scale=sortedScale[Math.floor(sortedScale.length/2)];
    }
    // Max
    else if (this.settings.strategy === 'max')
    {
      this.scale=Math.max(...this.scales);
    }
    else if (this.settings.strategy === 'average')
    {
      var total=0;
      for (var i=0;i<this.scales.length;++i) {
        total+=this.scales[i];
      }
      this.scale=total/this.scales.length;
    }
    else if (this.settings.strategy === 'fixed')
    {
      this.scale=0;
    }
    if (debug && !(++nbdebug % pickLog)) {
      if (this.settings.strategy !== 'fixed') assert.notEqual(this.scale,0);
      var dump=
        "**************"+
        "scale="+this.scale+
        " isDojo="+this.isDoji(this.hist[this.size-1])+
        " isShort="+this.isShort(this.hist[this.size-1])+
        " isLong="+this.isLong(this.hist[this.size-1]);
      //console.log(dump);
      log.info(dump);
    }
  }

  this.analyseOneCandle(this.hist[this.size-1]);
  this.analyseMultipleCandles()
};

Indicator.prototype.isDoji=function(x) {
  if (this.settings.strategy === 'fixed') return (x.pattern.realBody <= this.settings.dojiLimit);
  return (x.pattern.realBody <= this.scale * this.settings.dojiLimit);
}
Indicator.prototype.isShort=function(x) {
  if (this.settings.strategy === 'fixed') return (!this.isDoji(x) && (x.pattern.realBody <= this.settings.shortLimit));
  return (!this.isDoji(x) && (x.pattern.realBody <= this.scale * this.settings.shortLimit));
};

Indicator.prototype.isLong=function(x) {
  if (this.settings.strategy === 'fixed') return (x.pattern.realBody >= this.settings.longLimit);
  return (x.pattern.realBody >= this.scale * this.settings.longLimit)
};

Indicator.prototype.isShortUpper=function(x) {
  if (this.settings.strategy === 'fixed') return (x.pattern.upperShadow <= this.settings.shortLimit);
  return (x.pattern.upperShadow <= this.scale * this.settings.shortLimit)
};
Indicator.prototype.isLongUpper=function(x) {
  if (this.settings.strategy === 'fixed') return (x.pattern.upperShadow >= this.settings.longLimit);
  return (x.pattern.upperShadow >= this.scale * this.settings.longLimit)
};
Indicator.prototype.isShortLower=function(x) {
  if (this.settings.strategy === 'fixed') return (x.pattern.lowerShadow <= this.settings.shortLimit);
  return (x.pattern.lowerShadow <= this.scale * this.settings.shortLimit)
};
Indicator.prototype.isLongLower=function(x) {
  if (this.settings.strategy === 'fixed') return (x.pattern.lowerShadow >= this.settings.longLimit);
  return (x.pattern.lowerShadow >= this.scale * this.settings.longLimit)
};

function near(a,b,percent) {
  return (Math.abs(a-b) < (a*percent));
}

function isBetween(a,min,max) {
  return (a>min) && (a <max);
}

function inbody(a,candle) {
  if (candle.open > candle.close) {
    return (a >= candle.close) && (a <= candle.open);
  }
  else {
    return (a >= candle.open) && (a <= candle.close);
  }
}

Indicator.prototype.minDirection= function(dir,min,idx) {
  for (;idx>0;idx--) {
    var direction=(this.hist[idx].pattern.direction);
    if ((dir > 0) && (direction <= 0)) return false;
    if ((dir < 0) && (direction >= 0)) return false;
  }
  return true;
};

/*
 * Identify pattern with one candle
 */
Indicator.prototype.analyseOneCandle = function(last) {
  this.name='';
  this.result=0;

  if (
    this.isShort(last)
  ) {
    if (
    (last.pattern.upperShadow == 0) &&
    this.isLongLower(last)
    ) {
      // ###
      // ###
      //  |
      //  |
      //  |
      //  |  (or Hanging man)
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/Hammer.html
      last.name=this.name='Hammer';
    }
    else if (
      (last.pattern.lowerShadow == 0) &&
      this.isLongUpper(last)
    ) {
      //  |
      //  |
      //  |
      //  |
      // ###
      // ###
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/InvertedHammer.html
      last.name=this.name='InvertedHammer';
    }
    else if (
      (last.pattern.upperShadow < last.pattern.realBody) &&
      (last.pattern.lowerShadow < last.pattern.realBody)
    ) {
      //       |      |
      //      OOO    ###
      //      OOO or ###
      //       |      |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/EveningStar.html
      last.name=this.name='Star';
    }
  }
  else if (
    // ---##-
    (last.pattern.upperShadow >= 2 * last.pattern.realBody) &&
    (last.pattern.upperShadow >= 2 * last.pattern.lowerShadow) &&
    this.isShortLower(last)
  ) {
    if (
      this.isDoji(last)
      ) {
      //  |    |    |
      //  |    |    |
      //  |    |    |
      // -+-  ###  OOO
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/Gravestone%20Doji.html
      last.name=this.name="GravestoneDoji";
      this.result=last.pattern.direction;
    } else {
      //  |      |
      //  |      |
      //  |      |
      //  |      |
      //  |      |
      // ###    OOO
      // ###    OOO
      // ### or OOO
      //  |      |
      last.name=this.name="LongUpperShadow";
      this.result=last.pattern.direction;
    }
  } else if (
    (last.pattern.lowerShadow >= 2 * last.pattern.realBody) &&
    (last.pattern.lowerShadow >= 2 * last.pattern.upperShadow) &&
    this.isShortUpper(last)
  ) {
    if (
      this.isDoji(last)
      ) {
      // -+-  ###  OOO
      //  |    |    |
      //  |    |    |
      //  |    |    |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/Dragonfly%20Doji.html
      last.name=this.name = "DragonflyDoji";
      this.result = last.pattern.direction;
    } else {
      //  |    |
      // ###  OOO
      // ###  OOO
      // ###  OOO
      //  |    |
      //  |    |
      //  |    |
      //  |    |
      last.name=this.name="LongLowerShadow";
      this.result=last.pattern.direction;
    }
  } else if (
    (last.pattern.upperShadow == 0) &&
    (last.pattern.lowerShadow == 0)
  ) {
    // ###  OOO
    // ###  OOO
    // ###  OOO
    last.name=this.name="Marubozu";
    this.result=last.pattern.direction;
  } else if (
    // Same size of lower and upper shadow
    near(last.pattern.lowerShadow,last.pattern.upperShadow,this.settings.sameShadowLimit)
  ) {
    // ---|---
    if (this.isDoji(last)) {
      //  |    |    |
      //  |    |    |
      //  |    |    |
      // -+-  ###  OOO
      //  |    |    |
      //  |    |    |
      //  |    |    |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/Doji.html
      last.name=this.name="LongLeggedDoji";
      this.result=last.pattern.direction;
    } else if (
      (last.pattern.upperShadow >= 2 * last.pattern.realBody) &&
      (last.pattern.lowerShadow >= 2 * last.pattern.realBody)
    ) {
      //  |    |
      //  |    |
      //  |    |
      //  |    |
      // ###  OOO
      // ###  OOO
      //  |    |
      //  |    |
      //  |    |
      //  |    |
      last.name=this.name="SpinningTop";
      this.result=last.pattern.direction;
    }
  } else if (
    this.isDoji(last)
  ) {
    //  |    |    |
    // -+-  ###  OOO
    //  |    |    |
    // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/Doji.html
    last.name=this.name="Doji";
    this.result=last.pattern.direction;
  }
};

// Identifiy patterns with multiple candles
Indicator.prototype.analyseMultipleCandles=function() {

  // Patterns with 2 candles
  if (this.size >= 2) {
    var prev=this.hist[this.size-2];
    var curr=this.hist[this.size-1];

    if (
      this.isLong(prev) &&
      (prev.pattern.direction > 0) && // Up
      (curr.pattern.direction < 0) && // then down
      (prev.candle.high < curr.candle.open ) &&
      (prev.candle.low > curr.candle.close)
    ) {
      //       |
      //  |   ###
      // OOO  ###
      // OOO  ###
      // OOO  ###
      //  |   ###
      //      ###
      //       |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/Harami.html
      this.name = "HaramiDown";
      this.result = -1; // Down
    }
    else if (
      this.isLong(prev) &&
      (prev.pattern.direction < 0) && // Down
      (curr.pattern.direction > 0) && // then up
      (prev.candle.low > curr.candle.open) &&
      (prev.candle.high < curr.candle.close )
    ) {
      //       |
      //  |   OOO
      // ###  OOO
      // ###  OOO
      // ###  OOO
      //  |   OOO
      //      OOO
      //       |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/Harami.html
      this.name = "HaramiUp";
      this.result = 1; // Up
    }
    else if (
      (prev.pattern.direction < 0) &&
      this.isLong(prev) &&
      (curr.pattern.direction > 0) &&
      this.isLong(curr) &&
      (curr.candle.open < prev.candle.close) &&
      // Middle of prev body
      inbody(prev.candle.close+(prev.candle.open-prev.candle.close)/2,curr.candle)
    ) {
      //    |
      //   ###  |
      //   ### OOO
      //---###-OOO---
      //   ### OOO
      //   ### OOO
      //    |  OOO
      //        |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/PiercingPattern.html
      this.name="PiercingLine";
      this.result=1; // Up
    }
    else if (
      (prev.pattern.direction > 0) &&
      this.isLong(prev) &&
      (curr.pattern.direction < 0) &&
      this.isLong(curr) &&
      (curr.candle.open > prev.candle.open) &&
      // Middle of prev body
      inbody(prev.candle.close+(prev.candle.open-prev.candle.close)/2,curr.candle)
    ) {
      //        |
      //    |  ###
      //   OOO ###
      //   OOO ###
      //---OOO-###---
      //   OOO ###
      //   OOO  |
      //    |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/DarkCloudCover.html
      this.name = "DarkCloudCover";
      this.result = -1; // Down
    }
  }

  // Patterns with 3 candles
  if (this.size >= 3) {
    var prevprev=this.hist[this.size-3];
    var prev=this.hist[this.size-2];
    var curr=this.hist[this.size-1];
    if (
      (curr.pattern.direction < 0) &&
      this.isLong(curr) &&
      (prev.name === 'Star') &&
      (prevprev.pattern.direction > 0) &&
      this.isLong(prevprev) &&
      (curr.candle.open < Math.min(prev.candle.open,prev.candle.close)) // Gap
    ) {
      //       |      |
      //      OOO    ###
      //      OOO or ###
      //       |      |
      //                      } gap
      //  |               |
      // OOO             ###
      // OOO             ###
      // OOO             ###
      // OOO             ###
      //  |               |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/EveningStar.html
      prev.name = this.name = 'EveningStar';
      this.result = -1; // Down
    }
    else if (
      (curr.pattern.direction > 0) &&
      this.isLong(curr) &&
      (prev.name === 'Star') &&
      (prevprev.pattern.direction < 0) &&
      this.isLong(prevprev) &&
      (curr.candle.open > Math.min(prev.candle.open,prev.candle.close)) // Gap
    ) {
      //  |               |
      // ###             OOO
      // ###             OOO
      // ###             OOO
      //  |               |
      //                      } gap
      //       |      |
      //      OOO    ###
      //      OOO or ###
      //       |      |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/MorningStar.html
      prev.name = this.name = 'MorningStar';
      this.result = 1; // Up
    }
  }
  // https://www.abcbourse.com/apprendre/11_lecon6_2.html
  if (this.size >= 1 + this.settings.persistanceBeforHammerOrHangingMan) {
    var curr = this.hist[this.size - 1];
    if (
      (this.result != -1) &&
      (curr.name === 'Hammer') &&
      this.minDirection(-1, this.settings.persistanceBeforHammerOrHangingMan, this.size - 2)) {
      //  |
      // ###  |
      // ### ###  |
      // ### ### ###
      //  |  ### ###
      //      |  ###  ###   OOO
      //          |   ###   OOO
      //               |     |
      //               |  or |
      //               |     |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/Hammer.html
      curr.name = this.name = 'Hammer';
      this.result = 1; // Up
    }
    else if (
      (this.result != 1) &&
      (curr.name === 'Hammer') &&
      this.minDirection(1, this.settings.persistanceBeforHammerOrHangingMan, this.size - 2)) {
      //          |   ###   OOO
      //      |  OOO  ###   OOO
      //  |  OOO OOO   |     |
      // OOO OOO OOO   |  or |
      // OOO OOO  |    |     |
      // OOO  |
      //  |
      // @see http://www.onlinetradingconcepts.com/TechnicalAnalysis/Candlesticks/HangingMan.html
      curr.name = this.name = 'HangingMan';
      this.result = -1; // Down
    }
  }
};
module.exports = Indicator;
