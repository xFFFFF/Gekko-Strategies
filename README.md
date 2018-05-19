# Gekko-Strategies
## Introduction
[![made-with-bash](https://img.shields.io/badge/Made%20with-Bash-1f425f.svg)](https://www.gnu.org/software/bash/)
 [![Powered by Gekko-BacktestTool](https://img.shields.io/badge/Made%20with-Gekko%20BacktestTool-blue.svg)](https://github.com/xFFFFF/Gekko-BacktestTool) [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/xFFFFF/Gekko-Strategies/issues) [![GitHub contributors](https://img.shields.io/github/contributors/Naereen/StrapDown.js.svg)](https://GitHub.com/xFFFFF/Gekko-Strategies/graphs/contributors/)
 [![HitCount](http://hits.dwyl.com/xFFFFF/Gekko-Strategies.svg)](http://hits.dwyl.com/xFFFFF/Gekko-Strategies) [![GA](https://ga-beacon.appspot.com/UA-118674108-1/r)](https://github.com/xFFFFF/Gekko-Strategies)

    
[Gekko](http://github.com/askmike/gekko) Trading Bot. Repository of strategies which I found at Git and Google, orginal source is in README or .js file. Strategies was backtested, results are in [backtest_database.csv](https://github.com/xFFFFF/Gekko-Strategies/blob/master/backtest_database.csv) file.

I used [ForksScraper](https://github.com/xFFFFF/ForksScraper) and [Gekko BacktestTool](https://github.com/xFFFFF/Gekko-BacktestTool) to create content of this repository.

## Best strategy
Results are sorted by amount of best profit/day on unique **DATASETS**.     
.   
![Stats of strategies](http://i.imgur.com/UFn4P7U.png)

Remember, these are just **BACKTESTS**. Not real trading!
Feel free if You want share strategies on this repo. I will backtest it after push.   
## Installation
### Unix-like   
1. `git clone https://github.com/xFFFFF/Gekko-Strategies`   
2. `cd Gekko-Strategies`   
3. `bash install.sh`   
4. Restart Gekko   

### Windows
1. Download: https://github.com/xFFFFF/Gekko-Strategies/archive/master.zip   
2. Open downloaded file   
3. Go to each sub folders and copy .js file to Your Gekko folder for example Desktop\Gekko. File .toml copy to Desktop\gekko\config\strategies. Folder indicators (if exist) copy to C:\gekkko\strategies   

## Some links
### Gekko Tools
- Gekko Backtest Tool - https://github.com/xFFFFF/GekkoBacktestTool
- Japonicus - genetic algorithm - https://github.com/Gab0/japonicus
- GekkoGA - genetic algorithm - https://github.com/gekkowarez/gekkoga
- Complete image to VirtualBox with Gekko - https://github.com/tsungminyang/gekko
- Gekko Automated Backtest - https://github.com/tommiehansen/gab
- Kill, start market watchers/traders in Gekko UI - https://github.com/CyborgDroid/gekko-python
- GekkoWarez Bruteforce Backtester - https://github.com/gekkowarez/bruteforce
- MultiGekko - generate configs for CLI - https://github.com/bettimms/multi-gekko
- PostgresSQL Docker environment locally to be used by Gekko - https://github.com/mikemichaelis/postgekko

### Datasets
- Complete datasets in SQLite files: https://github.com/xFFFFF/Gekko-Datasets

### Gekko Addons
I warn you that not everything can work as it should.
#### Indicators
- Vix-Fix https://github.com/caux/gekkostuff
- HMA, ADX and others - https://github.com/Gab0/gekko-extra-indicators
- Fibonnaci and others - https://github.com/thegamecat/gekko-trading-stuff
- Neaptic - https://github.com/jmatty1983/gekkoNeatapticIndicator
- HMA and others (in JS, not Gekko) - https://github.com/jmatty1983/gekkoIndicators
- PSAR - https://github.com/illion20/gekko/tree/develop/strategies/indicators
- ZScore and others - https://github.com/CyborgDroid/gekkoIndicators

#### Exchanges
- CCXT - https://github.com/Yoyae/gekko
- Cryptopia - https://github.com/trainerbill/gekko/
- Bitmex - https://github.com/Johannnnes/gekko/
- AbuCoins - https://github.com/piotras9000/gekko/
- HitBTC - https://github.com/anhpha/gekko/
- Mercado - https://github.com/brvollino/gekko
- Mock - https://github.com/ilap/gekko/
- Dragonex - https://github.com/BoBoSama/gekko
- Bitfinex (websocket!) - https://github.com/cmroche/gekko/tree/bitfinex_ws
- Bitfinex margin trading - https://github.com/martinvasapollo/gekko/commit/1940a3a3a3763ca2a5f5eef9c8840867b6bbc60d

#### Plugins
- Market report - https://github.com/hiyan/gekkowk/
- Market Risk -https://github.com/ilap/gekko
- Multi Trader - https://github.com/roelplieger/gekko/
- Multi PaperTrader - https://github.com/roelplieger/gekko
- MySQL - https://github.com/jordanmmyers/mb-dev
- Draw indicators results - https://github.com/christianbaier/gekko
- Gekko strategies in Python - https://github.com/pauljherrera/gekko_python
- Display indicators in backtest results- https://github.com/Catwhisker/gekko
- Indicators on chart - https://github.com/PixelGithub/gekko/tree/PixelCrunch-IndicatorsGraph
- Discord - https://github.com/PixelGithub/gekko/tree/PixelCrunch-DiscordPlugin
- Store all trades from live in Google SpreadSheet - https://github.com/RJPGriffin/google-forms-gekko-plugin

### Others
- Send buy/sell advice to Gekko via IRC - https://github.com/gshearer/hodlgreed
- Like above but with Telegram - https://github.com/askmike/gekko/pull/2103/files
- Neural network price predictions strategy via external API - https://github.com/BitBanknz/bitbank-gekko
- Partial balance trading - https://github.com/Ali1/gekko/tree/0b1e98c47c012faeac92eecdcf66def595b6adcf
- Brute forcer strat parameters in Gekko - https://github.com/askmike/gekko/pull/1204
- Unofficial Gekko UI (showing indicator results on chart) in Quasar - https://github.com/H256/gekko-quasar-ui
- Above UI implemented in Gekko - https://github.com/H256/gekko
- Batch backtests in Gekko - https://github.com/askmike/gekko/pull/1109
- Use different candleSizes in strategy - https://github.com/zappra/gekko/blob/develop/strategies/timeframes.js

## Donate?
![Nie biorę](https://i.imgur.com/Ae4Ptmf.jpg)   ![Imgur](https://i.imgur.com/FxIxQGr.png)   


I am not the author of the strategies posted here. Donate authors. If you like my work then share your strategy. That's all.   
