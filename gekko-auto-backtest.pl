#!/usr/bin/perl -w
use strict;
use Parallel::ForkManager;

# Put your strategy names between brackets in line below. Strategy seperate with space.
my @strategies = qw( bestone_updated_hardcoded BodhiDI_public buyatsellat_ui DynBuySell RSI_BULL_BEAR RSI_BULL_BEAR_ADX rsidyn TEMA );
# Put your pairs between brackets in line below. Use exchange:currency:asset format. Pair seperate with space.
my @pairs = qw( binance:USDT:NEO binance:USD:LTC );
# Between brackets bellow You can change threads amount.
my $pm = Parallel::ForkManager->new(5);
# Gekko config file is bellow. Change what You need.
my $gconfig = q(
var config = {};
config.debug = false; // for additional logging / debugging
config.watch = {
	exchange: 'exchange',
	currency: 'p1',
	asset: 'p2',
}
config.tradingAdvisor = {
	enabled: true,
	method: 'strategy',
	candleSize: 5,
	historySize: 144,
}
// Strategies settings. If you add new strategy You must add values from .toml file below!
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
config.mounirs_esto = { 
	rsi:  {
		interval: 6 },
	ema: {
		ema1: 10 }
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
config.paperTrader = {
	enabled: true,
	reportInCurrency: true,
	simulationBalance: {
		asset: 0,
		currency: 400,
	},
	feeMaker: 0.1,
	feeTaker: 0.1,
	feeUsing: 'maker',
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
config.adapter = 'mongodb';
config.mongodb = {
	path: 'plugins/mongodb',
	version: 0.1,
	connectionString: 'mongodb://localhost/gekko', // connection to mongodb server
	dependencies: [{
		module: 'mongojs',
		version: '2.4.0'
	}]
}
config.backtest = {
	daterange:  'scan',
// coment above line and uncoment bellow lines to using definied datarange
//	daterange: {
//		from: "2018-02-10 00:00:00",
//		to: "2018-02-17 00:00:00"
//	},
batchSize: 50
}
config['I understand that Gekko only automates MY OWN trading strategies'] = true;
module.exports = config;
);

# Lets start!
foreach (@pairs) {
	my $pid = $pm->start and next;
	my @sets = split /:/, $_;
	foreach (@strategies) {
		my $btfile = "$sets[1]-$sets[2]-$_-config.js";
		# Log file name. Variables $sets[1], $sets[2] and $_ are required.
		my $lfile = "$sets[1]-$sets[2]-$_.log";
		$gconfig =~ s/(?<=exchange: ')(.*?)(?=',)/$sets[0]/g;
		$gconfig =~ s/(?<=currency: ')(.*?)(?=',)/$sets[1]/g;
		$gconfig =~ s/(?<=asset: ')(.*?)(?=',)/$sets[2]/g;
		$gconfig =~ s/(?<=method: ')(.*?)(?=',)/$_/g;
		open my $fh, '>', $btfile or die "Cannot open output.txt: $!";
		print $fh join ("\n",$gconfig);
		close $fh;
		system("cat $btfile > $lfile");
		system("node gekko -b -c $btfile >> $lfile");
		print "Backtesting $_ strategy on pair $sets[1]-$sets[2] is done. Results are in $lfile .\n";
		unlink $btfile;
		}
	$pm->finish;
	}
$pm->wait_all_children;

print "Goodbye!\n";
