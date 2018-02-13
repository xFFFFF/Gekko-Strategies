#!/usr/bin/perl -w
use strict;
use DateTime;

my @strategies = ('bestone_updated_hardcoded', 'BodhiDI_public', 'buyatsellat_ui', 'DynBuySell', 'RSI_BULL_BEAR', 'RSI_BULL_BEAR_ADX', 'rsidyn', 'TEMA');
my @pairs = ('binance:BTC:VIBE', 'binance:BTC:MOD', 'poloniex:BTC:DGB');
my $gconfig = q(
// Everything is explained here:
// @link https://gekko.wizb.it/docs/commandline/plugins.html

var config = {};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          GENERAL SETTINGS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.debug = true; // for additional logging / debugging

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                         WATCHING A MARKET
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.watch = {

  // see https://gekko.wizb.it/docs/introduction/supported_exchanges.html
  exchange: 'exchange',
  currency: 'p1',
  asset: 'p2',

  // You can set your own tickrate (refresh rate).
  // If you don't set it, the defaults are 2 sec for
  // okcoin and 20 sec for all other exchanges.
  // tickrate: 20
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING TRADING ADVICE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.tradingAdvisor = {
  enabled: true,
  method: 'strategy',
  candleSize: 5,
  historySize: 12,
}

config.bestone_updated_hardcoded = {
myStoch: {
highThreshold: 80,
lowThreshold: 20,
optInFastKPeriod: 14,
optInSlowKPeriod: 5,
optInSlowDPeriod: 5 
},
myLongEma: {
optInTimePeriod: 100 
},
myShortEma: {
optInTimePeriod: 50 
},
stopLoss: {
percent: 0.9 }
};

config.BodhiDI_public = { 
optInTimePeriod: 14,
diplus: 23.5,
diminus: 23
};

config.buyatsellat_ui = { 
buyat: 1.20,
sellat: 0.98,
stop_loss_pct: 0.85,
sellat_up: 1.01
};

config.DynBuySell = { 
thresholds:  {
interval: 8,
sell_at: 1.05,
buy_at: 0.97,
buy_at_up: 1.003,
stop_loss_pct: 0.85 }
};

config.RSI_BULL_BEAR = { 
SMA_long: 1000,
SMA_short: 50,
BULL_RSI: 10,
BULL_RSI_high: 80,
BULL_RSI_low: 60,
BEAR_RSI: 15,
BEAR_RSI_high: 50,
BEAR_RSI_low: 20
};

config.RSI_BULL_BEAR_ADX = { 
SMA_long: 1000,
SMA_short: 50, 
BULL_RSI: 10, 
BULL_RSI_high: 80, 
BULL_RSI_low: 60, 
BEAR_RSI: 15, 
BEAR_RSI_high: 50, 
BEAR_RSI_low: 20,
ADX: 3, 
ADX_high: 70, 
ADX_low: 50
};

config.rsidyn = { 
interval: 8,
sellat: 0.4,
buyat: 1.5 ,
stop_percent: 0.96,
stop_enabled: true
};

config.TEMA = {
short: 10,
long: 80,

SMA_long: 200
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING PLUGINS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// do you want Gekko to simulate the profit of the strategy's own advice?
config.paperTrader = {
  enabled: true,
  // report the profit in the currency or the asset?
  reportInCurrency: true,
  // start balance, on what the current balance is compared with
  simulationBalance: {
    // these are in the unit types configured in the watcher.
    asset: 0,
    currency: 400,
  },
  // how much fee in % does each trade cost?
  feeMaker: 0.1,
  feeTaker: 0.1,
  feeUsing: 'maker',
  // how much slippage/spread should Gekko assume per trade?
  slippage: 0.05,
}

config.performanceAnalyzer = {
  enabled: true,
  riskFreeReturn: 5
}

config.trader = {
  enabled: false,
  key: '',
  secret: '',
  username: '', // your username, only required for specific exchanges.
  passphrase: '', // GDAX, requires a passphrase.
  orderUpdateDelay: 1, // Number of minutes to adjust unfilled order prices
}

config.adviceLogger = {
  enabled: false,
  muteSoft: true // disable advice printout if it's soft
}

config.candleWriter = {
  enabled: false
}

config.adviceWriter = {
  enabled: false,
  muteSoft: true,
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING ADAPTER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.adapter = 'sqlite';

config.sqlite = {
  path: 'plugins/sqlite',

  dataDirectory: 'history',
  version: 0.1,

  journalMode: require('./web/isWindows.js') ? 'DELETE' : 'WAL',

  dependencies: []
}

config.backtest = {
  daterange:  'scan',
  batchSize: 50
}

// set this to true if you understand that Gekko will
// invest according to how you configured the indicators.
// None of the advice in the output is Gekko telling you
// to take a certain position. Instead it is the result
// of running the indicators you configured automatically.
//
// In other words: Gekko automates your trading strategies,
// it doesn't advice on itself, only set to true if you truly
// understand this.
//
// Not sure? Read this first: https://github.com/askmike/gekko/issues/201
config['I understand that Gekko only automates MY OWN trading strategies'] = true;

module.exports = config;
);



print "Lets start!\n";

foreach (@pairs) {
my @sets = split /:/, $_;
	foreach (@strategies) {
		$gconfig =~ s/(?<=exchange: ')(.*?)(?=',)/$sets[0]/g;
		$gconfig =~ s/(?<=currency: ')(.*?)(?=',)/$sets[1]/g;
		$gconfig =~ s/(?<=asset: ')(.*?)(?=',)/$sets[2]/g;
		$gconfig =~ s/(?<=method: ')(.*?)(?=',)/$_/g;
		open my $fh, '>', "backtest-config.js" or die "Cannot open output.txt: $!";
		print $fh join ("\n",$gconfig);
		close $fh; # Not necessary, but nice to do

		system("cat backtest-config.js > backtest-$sets[1]-$sets[2]-$_.log");
		system("node gekko -b -c backtest-config.js >> backtest-$sets[1]-$sets[2]-$_.log");
		print "Backtest $_ strategy on pair $sets[1]-$sets[2] is done.\n"
	}
}
print "Goodbye!\n";
