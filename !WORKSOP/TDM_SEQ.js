var strat = {
  init: function() {
    this.name = 'TDM_SEQ';
    this.numCountdowns = 0;
    this.pendingAdvice = null;
    this.addIndicator('tdmSeq', 'TDM_SEQ');
  },

  update: function(candle) {
    var seqResult;

    this.indicators.tdmSeq.update(candle);
    seqResult = this.indicators.tdmSeq.result;
    if (this.numCountdowns != seqResult.numCountdowns) {
	console.log('TDM_SEQ(s): New complete countdown (', seqResult.lastCdType, ') after candle on', candle.start);
	this.numCountdowns = seqResult.numCountdowns;
	this.pendingAdvice = seqResult.lastCdType;
    }
  },

  log: function () {},

  check: function() {
    switch (this.pendingAdvice) {
    case 'buy':
      console.log('TDM_SEQ(s): Advising long');
      this.advice('long');
      this.pendingAdvice = null;
      break;
    case 'sell':
      console.log('TDM_SEQ(s): Advising short');
      this.advice('short');
      this.pendingAdvice = null;
      break;
    default:
//      console.log('TDM_SEQ(s): Advising none');
      this.advice();
      break;
    }
  }
};

module.exports = strat;
