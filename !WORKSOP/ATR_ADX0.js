const randomExt = require('random-ext');

const config = {
  stratName: 'ATR_ADX',
  gekkoConfig: {
    watch: {
      exchange: 'gdax',
      currency: 'EUR',
      asset: 'ETH'
    },

    daterange: 'scan',

    // daterange: {
    //   from: '2017-12-08 06:24:00',
    //   to: '	2018-02-16 07:24:00'
    //   //to: '2017-12-05 15:04:00'
    // },

    simulationBalance: {
      'asset': 0,
      'currency': 100
    },

    slippage: 0.05,
    feeTaker: 0.25,
    feeMaker: 0.15,
    feeUsing: 'taker', // maker || taker

  },
  apiUrl: 'http://localhost:3000',

  // Population size, better reduce this for larger data
  populationAmt: 20,

  // How many completely new units will be added to the population (populationAmt * variation must be a whole number!!)
  variation: 0.5,

  // How many components maximum to mutate at once
  mutateElements: 7,

  // How many parallel queries to run at once
  parallelqueries: 8,

  // profit || score
  // score = profit * sharpe -- feedback?
  // profit = recommended!
  mainObjective: 'profit',

  // optionally recieve and archive new all time high every new all time high
  notifications: {
    email: {
      enabled: false,
      receiver: 'me@gmail.com',
      senderservice: 'gmail',
      sender: 'me@gmail.com',
      senderpass: '----',
    },
  },
  //candleValues: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
  candleValues: [60, 120, 180, 240, 300, 360, 420, 480, 540],
  getProperties: () => ({
    // Strat settings must be flattened and cannot be nested for mutation to work properly!

    /*
    # ATR period
    ATR = 22

    #ADX period
    ADX = 22

    # ATR Threshold
    ATR_threshold = 30

    #ATR Multiplers
    BULL_Multiplier_low = 3
    BULL_Multiplier_high = 6
    BEAR_Multiplier_low = 3
    BEAR_Multiplier_high = 6


    */
    historySize: 30, // max possible SMA_long

    ATR: randomExt.integer(30, 10),
    ADX: randomExt.integer(30, 10),

    ATR_threshold: randomExt.integer(60, 20),
    BEAR_Multiplier_low: randomExt.integer(20, 1),
    BEAR_Multiplier_high: randomExt.integer(20, 1),
    BULL_Multiplier_low: randomExt.integer(20, 1),
    BULL_Multiplier_high: randomExt.integer(20, 1),


    candleSize: config.candleValues[randomExt.integer(config.candleValues.length - 1, 0)]

  })
};

module.exports = config;