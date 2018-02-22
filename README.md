# Gekko-Strategies
# Introduction
Repository of strategies which I found at Git and Google. All strategies was backtested, result is in directory of each strategy. In addition, I share my tool, which I use to perform multiple backtests at this same time.

# Auto multiple backtests script
gekko-auto-backtest.pl - my script which doing backtests on multiple strategies and/or multiple coin pairs. 
1. Copy file to Gekko directory.
2. Import datasets in Gekko UI or Gekko command line
3. Edit gekko-auto-backtest.pl and set imported @pairs and @strategies. All Gekkos backtest settings are in this file.
4. Install perl dependies:
`$ npm install Parallel::ForkManager`
5. Run scipt:
`$ perl gekko-auto-backtest.pl`
5. Results will be in .log files in main Gekko directory.

Known bugs

Backtest don't start if pair has multiple datasets (different time period)

