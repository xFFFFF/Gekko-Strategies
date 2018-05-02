var log = require('../core/log');
var config = require('../core/util.js').getConfig();
var watchConfig = config.watch;
var settings = config.custom;
var async = require('async');
var modeset = require('../core/util.js').gekkoMode();

//Defining a custom strategy.
var strat = {};

//Prepare variables needed for strategy.
strat.init = function() {
    this.requiredHistory = 0; 
    ////Calculations and Indicators
    var nextActionBuy = 'yes'; // Options: 1 = yes, 0 = no. Next action is to buy. 
    var nextActionSell = 'no'; // Options: 1 = yes, 0 = no. Next action is to sell.    
    var counter = 0;
    var priceCounter = 0;
    var changeinPriceAmt = 0;
    var changeinPricePer = 0;
    var prevTradeVol = 0;
    var prevHighPrice = 0;
    var prevLowPrice = 0;
    var changeinTradeVolAmt = 0;
    var changeinTradeVolPer = 0;
    this.addIndicator('changeinPriceAmt', 'MACD', this.settings);
    this.addIndicator('changeinPricePer', 'MACD', this.settings);
    this.addIndicator('changeinTradeVolAmt', 'MACD', this.settings);
    this.addIndicator('changeinTradeVolPer', 'MACD', this.settings);
    var previousAction = 'sell'; //Options: 'sell' or 'buy'. Last completed trade type. See this page https://github.com/askmike/gekko/issues/844
    var adviceGiven = 'no'; // Whether trade advice has been given.
    var buyPricePersistence = 0; // How long the price trend for buying has continued in terms of candles.
    var sellPricePersistence = 0; // How long the price trend for selling has continued in terms of candles.
    var buyVolPersistence = 0; // How long the volume trend for buying has continued in terms of candles.
    var sellVolPersistence = 0; // How long the trend volume trend for selling has continued in terms of candles.    
    var prevVoltoPrint = 0; // Variable used for printing purposes only.
    var prevHighPricetoPrint = 0; // Variable used for printing purposes only.
    var prevLowPricetoPrint = 0; //Variable used for printing purposes only.
    var buyPrice = 0; //Price at which last buy was made.
    
    
    ////User Selections
    var buyImmediately = 'no'; //Options: 'yes' or 'no'. Make an initial buy as soon as trade bot starts, no matter what.
    //Options: 'price', 'thresholds', 'volume', or 'price&volume'. Factor being assessed when deciding to trade.
    var tradeFactors = 'price';
    //Options: 'decrease' or 'increase'. Buy if there's been a decrease (or, if specified, increase) in factor selected.
    var buyIfPrice = 'decrease';
     //Options: 'decrease' or 'increase'. Sell if there's been a decrease (or, if specified, increase) in factor selected.
    var sellIfPrice = 'increase'; 
    //Options: 'decrease' or 'increase'. Buy if there's been a decrease (or, if specified, increase) in factor selected.
    var buyIfVol = 'decrease';
     //Options: 'decrease' or 'increase'. Sell if there's been a decrease (or, if specified, increase) in factor selected.
    var sellIfVol = 'increase';
    var changeType = '#'; //Options are '#' or '%' where # is amount (in dollars when dealing with price).
    var priceDecreaseAmt = 0.00001; //Amount ($) by which user wants price to decrease before taking action.
    var priceIncreaseAmt = 0.00001; // Amount ($) by which user wants price to increase before taking action.
    var priceDecreasePer = 0.000001; // % by which user wants price to decrease before taking action.
    var priceIncreasePer = 0.000001; // % by which user wants price to increase before taking action.
    var tradeVolDecreaseAmt = 0.00001; //Amount by which user wants trade volume to decrease before taking action.
    var tradeVolIncreaseAmt = 0.00001; // Amount by which user wants trade volume to increase before taking action.
    var tradeVolDecreasePer = 0.000001; // % by which user wants trade volume to decrease before taking action.
    var tradeVolIncreasePer = 0.000001; // % by which user wants trade volume to increase before taking action.
    var buyPriceThreshold = 5650; // Price at or below which user wants to buy.
    var sellPriceThreshold = 5660; // Price at or above which user wants to sell.
    var buyPricePersistenceThreshold = 3; //How many candles for which trend must hold before buy is completed (min 1).
    var sellPricePersistenceThreshold = 2; //How many candles for which trend must hold before sell is completed (min 1).
    var buyVolPersistenceThreshold = 3; //How many candles for which trend must hold before buy is completed (min 1).
    var sellVolPersistenceThreshold = 2; //How many candles for which trend must hold before sell is completed (min 1).
    var priceProtection = 'disabled'; //Options are 'enabled' or 'disabled'. Ensures that sell price is higher than buy price if enabled.
    var priceType = 'open/close'; //Options are 'open/close' for candle open and close prices or 'high' for candle high prices, or 'low' for candle low prices. This will determine which prices are used in the calculations for amount and percent change.  

} //end init

//Determine if a purchase should be made.
strat.assessBuy = function assessBuy(candle){
    //Check if next action is buy or sell.
    if(this.settings.nextActionBuy == 'no'){
        log.debug('Can\'t Buy, Must Sell First.');
    }    
    //Next action is to buy.
    if(this.settings.nextActionBuy == 'yes'){
        if(this.settings.tradeFactors == 'price&volume'){
        //Do nothing. Decision made at end of check function.
        }
        //Buy.
        else{
            this.adviseBuy(this.candle);   
        }     
    }     
}//end assessBuy

//Determine if a sale should be made.
strat.assessSell = function assessSell(candle){
    //Check if next action is buy or sell.    
    if(this.settings.nextActionSell == 'no'){
        log.debug('Can\'t Sell, Must Buy First.');
    }    
    //Next action is to sell.
    if(this.settings.nextActionSell == 'yes'){
        if(this.settings.tradeFactors == 'price&volume'){
        //Do nothing. Decision made at end of check function.
        }
        //Sell
        else{
            this.adviseSell(this.candle);   
        }     
    }    
}

//Buy
strat.adviseBuy = function adviseBuy(candle){
    this.advice('long');    
    //Ensure that advice will not be given twice in same candle.
    this.settings.adviceGiven = 'yes';
    log.debug('******TRADE     Buying at: ', this.candle.close);   
    //Set previousAction buy.
    this.previousAction = 'buy';
    //Have to reset this because can't keep buying after you've used all your money to buy. Next action should be to sell.
    this.settings.nextActionSell = 'yes';
    this.settings.nextActionBuy = 'no';
    //Reset buyPricePersistence.
    this.buyPricePersistence = 0;
    //Record the purchase price.
    this.buyPrice = this.candle.close;    
}

//Sell
strat.adviseSell = function adviseSell(candle){
    //Check if priceProtection is enabled. If yes, can't sell until price is greater than purchase price.
    if(this.settings.priceProtection == 'enabled'){
        log.debug('Price Protection Enabled. Won\'t Sell Until Price is at Least: ', this.buyPrice);
        if(this.candle.close > this.buyPrice){
            this.advice('short');  
            //Ensure that advice will not be given twice in same candle.
            this.settings.adviceGiven = 'yes';
            log.debug('******TRADE    Selling at: ', this.candle.close); 
            //Set previousAction to sell.
            this.previousAction = 'sell'; 
            //Have to reset this because can't keep selling after you've sold everything. Next action should be to buy.
            this.settings.nextActionBuy = 'yes';       
            this.settings.nextActionSell= 'no';
            //Reset sellPricePersistence.
            this.sellPricePersistence = 0;                                
        }
    }
    //priceProtection not enabled, so can sell at any price, even if it is lower than purchase price.
    else if(this.settings.priceProtection == 'disabled'){
        this.advice('short');  
        //Ensure that advice will not be given twice in same candle.
        this.settings.adviceGiven = 'yes';
        log.debug('******TRADE    Selling at: ', this.candle.close); 
        //Set previousAction to sell.
        this.previousAction = 'sell'; 
        //Have to reset this because can't keep selling after you've sold everything. Next action should be buy.
        this.settings.nextActionBuy = 'yes';       
        this.settings.nextActionSell= 'no';
        //Reset sellPricePersistence.
        this.sellPricePersistence = 0;
        log.debug('Next action is to sell: ', this.settings.nextActionSell, ' Next action is to buy: ', this.settings.nextActionBuy, ' Advice given: ', this.settings.adviceGiven);        
    }    
}

//Calculations made for each candle.
strat.update = function(candle) {
    //Reset adviceGiven to 'no' so advice can be given for this candle.
    this.settings.adviceGiven = 'no';
    //Calculate changes in price based on a candle's open and close prices.
    if(this.settings.priceType == 'open/close'){
        //Compute change in price as an amount.
        this.settings.changeinPriceAmt = (candle.close - candle.open);
        //Compute change in price as a percentage.
        this.settings.changeinPricePer = ((candle.close - candle.open)/candle.open) * 100;
    }
    //Calculate changes in price based on last candle's high price and this candle's high price.    
    else if(this.settings.priceType == 'high'){        
        if(this.priceCounter){
            //Compute change in price as an amount.
            this.settings.changeinPriceAmt = (candle.high - this.prevHighPrice);
            //Compute change in price as a percentage.
            this.settings.changeinPricePer = ((candle.high - this.prevHighPrice) / this.prevHighPrice) * 100;
            this.prevHighPrice = candle.high;
        }
        //This is the first time through/first candle, so there is no previous candle to use for calculations. Set previous candle high price = current candle high price. Increment counter so next time/candle, if(this.priceCounter) will be true.
        else{
            this.prevHighPrice = this.candle.high;
            this.priceCounter = 1;
        }  
    }
    //Calculate changes in price based on last candle's low price and this candle's low price.  
    else if(this.settings.priceType == 'low'){
        if(this.priceCounter){
            //Compute change in price as an amount.
            this.settings.changeinPriceAmt = (candle.low - this.prevLowPrice);
            //Compute change in price as a percentage.
            this.settings.changeinPricePer = ((candle.low - this.prevLowPrice) / this.prevLowPrice) * 100;
            this.prevLowPrice = candle.low;
        }
        //This is the first time through/first candle, so there is no previous candle to use for calculations. Set previous candle low price = current candle low price. Increment counter so next time/candle, if(this.priceCounter) will be true.           
        else{
            this.prevLowPrice = candle.low;
            this.priceCounter = 1;        
        }
    }
    
    //Trade Volume
    //Calculate changes in trade volume based on last candle's trade volume.
    if(this.counter){
        //Compute change in trade volume as an amount.
        this.settings.changeinTradeVolAmt = this.candle.volume - this.settings.prevTradeVol;    
        //Compute change in trade volume as a percentage.
        this.settings.changeinTradeVolPer = ((this.candle.volume - this.settings.prevTradeVol)/this.settings.prevTradeVol) * 100; 
        this.settings.prevVoltoPrint = this.settings.prevTradeVol;
        this.settings.prevTradeVol = this.candle.volume;
    }
    //This is the first time through/first candle, so there is no previous candle to use for calculations. Set previous trade volume = current candle trade volume. Increment counter so next time, if(this.counter) will be true.   
    else{
        this.settings.prevTradeVol = this.candle.volume;  
        this.settings.prevVoltoPrint = this.settings.prevTradeVol;
        this.counter = 1;     
    }
        
} // end update

// For debugging purposes and record keeping. Logs can be found in the logs folder. Select the paperTrader log with the timestamp equal to your paperTrader start time.
strat.log = function() {
    if(modeset !== 'backtest'){
        log.debug('--------CANDLE--------');
        log.debug('Next action is to sell: ', this.settings.nextActionSell, ' Next action is to buy: ', this.settings.nextActionBuy, ' Advice given: ', this.settings.adviceGiven);
        log.debug('------Price Information------');    
        log.debug('Open: ', this.candle.open, ' Close: ', this.candle.close, ' High: ', this.candle.high, ' Low: ', this.candle.low);
        log.debug('Change in Price: $', this.settings.changeinPriceAmt.toFixed(8), ' (',this.settings.changeinPricePer.toFixed(8),'%)');
        log.debug('------Trade Volume Information------');    
        log.debug('This Candle\'s Trade Volume: ', this.candle.volume.toFixed(8), ' Previous Trade Volume: ', this.settings.prevVoltoPrint.toFixed(8));    
        log.debug('Change in Trade Volume: ', this.settings.changeinTradeVolAmt.toFixed(8), ' (', this.settings.changeinTradeVolPer.toFixed(8), '%)' );     
   }

} // end log

// Based on the newly calculated information, check if we should make a purchase or sale.
strat.check = function(candle) {
    //User wants to buy immediately, even if the first candle doesn't meet the qualifications, so make a purchase.
    if(this.settings.buyImmediately == 'yes'){
        log.debug('BuyImmediately enabled. Completing initial buy.');
        this.adviseBuy(this.candle);
        //Turn off buyImmediately so it is not repeated on next candle.
        this.settings.buyImmediately = 'no';
    }
    //User selected change in price or price&volume as trade factor(s).
    if((this.settings.tradeFactors == 'price') || (this.settings.tradeFactors == 'price&volume')){
        //User is looking at $ changes (as opposed to %).
        if(this.settings.changeType == '#'){
            //User wants to buy when there's been a decrease in price in terms of $.
            if (this.settings.buyIfPrice == 'decrease'){
                //The decrease in price is at least how much the user specified (priceDecreaseAmt).
                if(this.settings.changeinPriceAmt <= (this.settings.thresholds.priceDecreaseAmt * -1)){
                    //Increment the persistence value as the trend continued for another candle.
                    if(this.buyPricePersistence){
                        this.buyPricePersistence = this.buyPricePersistence +1;
                    }
                    else{
                        this.buyPricePersistence = 1;
                    }
                    //Compare actual buy persistence to buy persistence threshold.
                    log.debug('Price: Actual Buy Persistence: ', this.buyPricePersistence, ' Persistence Threshold: ', this.settings.buyPricePersistenceThreshold);                    
                    //User selected to buy when the price decreased by at least the specified amount, the trend held, and advice has not yet been given for this candle.            
                   if((this.settings.adviceGiven == 'no') && (this.buyPricePersistence >= this.settings.buyPricePersistenceThreshold)){   
                       //Determine whether a purchase should be made, and if so, buy.
                       this.assessBuy(this.candle);                                                                                            
                    }
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.buyPricePersistence = 0;
                }
            } // end buyIfPrice = decrease
            
            //User wants to sell when there's been a decrease in price in terms of $.
            if (this.settings.sellIfPrice == 'decrease'){  
                //The decrease in price is at least how much the user specified (priceDecreaseAmt).                
                if(this.settings.changeinPriceAmt <= (this.settings.thresholds.priceDecreaseAmt * -1)){
                    //Increment the persistence value as the trend continued for another candle.                    
                    if(this.sellPricePersistence){
                        this.sellPricePersistence = this.sellPricePersistence +1;
                    }
                    else{
                        this.sellPricePersistence = 1;
                    }
                    //Compare actual sell persistence to sell persistence threshold.
                    log.debug('Price: Actual Sell Persistence: ', this.sellPricePersistence, ' Persistence Threshold: ', this.settings.sellPricePersistenceThreshold);                    
                    //User selected to sell when the price decreased by at least the specified amount, the trend held, and advice has not yet been given for this candle.                  
                    if((this.settings.adviceGiven == 'no') && (this.sellPricePersistence >= this.settings.sellPricePersistenceThreshold) ){ 
                        //Assess whether a sale should be made, and if so, sell.
                        this.assessSell(this.candle);
                    }                    
                }
                //The trend didn't continue, so reset the actual persistence value.                
                else{
                    this.sellPricePersistence = 0;
                }
            } // end sellIfPrice = decrease
            //User wants to buy when there's been an increase in price in terms of $.            
            if (this.settings.buyIfPrice == 'increase'){              
                //The increase in price is at least how much the user specified (priceIncreaseAmt).                   
                if(this.settings.changeinPriceAmt >= (this.settings.thresholds.priceIncreaseAmt)){
                    //Increment the persistence value as the trend continued for another candle.                      
                    if(this.buyPricePersistence){
                        this.buyPricePersistence = this.buyPricePersistence +1;
                    }
                    else{
                        this.buyPricePersistence = 1;
                    }   
                    //Compare actual buy persistence to buy persistence threshold.                    
                    log.debug('Price: Actual Buy Persistence: ', this.buyPricePersistence, ' Persistence Threshold: ', this.settings.buyPricePersistenceThreshold);              
                    //User selected to buy when the price increased by at least the specified amount, the trend held, and advice has not yet been given for this candle. 
                    if((this.settings.adviceGiven == 'no') && (this.buyPricePersistence >= this.settings.buyPricePersistenceThreshold)){   
                        //Assess whether a purchase should be made, and if so, buy.
                        this.assessBuy(this.candle);
                    }    
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.buyPricePersistence = 0;
                }    
            }//end if buyIfPrice = increase
            //User wants to sell when there's been an increase in price in terms of $.               
            if (this.settings.sellIfPrice == 'increase'){
                //The increase in price is at least how much the user specified (priceIncreaseAmt).                  
                if(this.settings.changeinPriceAmt >= (this.settings.thresholds.priceIncreaseAmt)){
                    //Increment the persistence value as the trend continued for another candle.                       
                    if(this.sellPricePersistence){
                        this.sellPricePersistence = this.sellPricePersistence +1;
                    }
                    else{
                        this.sellPricePersistence = 1;
                    }    
                    //Compare actual sell persistence to sell persistence threshold.                    
                    log.debug('Price: Actual Sell Persistence: ', this.sellPricePersistence, ' Persistence Threshold: ', this.settings.sellPricePersistenceThreshold);           
                    //User selected to sell when the price increased by at least the specified amount, the trend held, and advice has not yet been given for this candle. 
                    if( (this.settings.adviceGiven == 'no') && (this.sellPricePersistence >= this.settings.sellPricePersistenceThreshold)){ 
                        //Assess whether a sale should be made, and if so, sell.
                        this.assessSell(this.candle);
                    }    
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.sellPricePersistence = 0;
                }  
            }//end if sellIfPrice = increase            
        }//end changeType = #
        
        //User is looking at % changes (as opposed to $).        
        else if(this.settings.changeType == '%'){
            //User wants to buy when there's been a decrease in price in terms of %.
            if (this.settings.buyIfPrice == 'decrease'){
                //The % decrease in price is at least how much the user specified (priceDecreasePer).
                if(this.settings.changeinPricePer <= (this.settings.thresholds.priceDecreasePer *-1)){ 
                    //Increment the persistence value as the trend continued for another candle.
                    if(this.buyPricePersistence){
                        this.buyPricePersistence = this.buyPricePersistence +1;
                    }
                    else{
                        this.buyPricePersistence = 1;
                    }
                    //Compare actual buy persistence to buy persistence threshold.
                    log.debug('Price: Actual Buy Persistence: ', this.buyPricePersistence, ' Persistence Threshold: ', this.settings.buyPricePersistenceThreshold);                    
                    //User selected to buy when the price decreased by at least the specified %, the trend held, and advice has not yet been given for this candle.            
                    if((this.settings.adviceGiven == 'no') && (this.buyPricePersistence >= this.settings.buyPricePersistenceThreshold)){
                        //Assess whether a purchase should be made, and if so, buy.
                        this.assessBuy(this.candle);                     
                    }
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.buyPricePersistence = 0;
                }
            } // end buyIfPrice = decrease
            
            //User wants to sell when there's been a decrease in price in terms of %.
            if (this.settings.sellIfPrice == 'decrease'){  
                //The % decrease in price is at least how much the user specified (priceDecreasePer).               
                if(this.settings.changeinPricePer <= (this.settings.thresholds.priceDecreasePer *-1)){ 
                    //Increment the persistence value as the trend continued for another candle.                    
                    if(this.sellPricePersistence){
                        this.sellPricePersistence = this.sellPricePersistence +1;
                    }
                    else{
                        this.sellPricePersistence = 1;
                    }
                    //Compare actual sell persistence to sell persistence threshold.
                    log.debug('Price: Actual Sell Persistence: ', this.sellPricePersistence, ' Persistence Threshold: ', this.settings.sellPricePersistenceThreshold);                    
                    //User selected to sell when the price decreased by at least the specified %, the trend held, and advice has not yet been given for this candle.                  
                    if((this.settings.adviceGiven == 'no') && (this.sellPricePersistence >= this.settings.sellPricePersistenceThreshold) ){ 
                        //Assess whether a sale should be made, and if so, sell.
                        this.assessSell(this.candle);
                    }                    
                }
                //The trend didn't continue, so reset the actual persistence value.                
                else{
                    this.sellPricePersistence = 0;
                }
            } // end sellIfPrice = decrease
            //User wants to buy when there's been an increase in price in terms of %.            
            if (this.settings.buyIfPrice == 'increase'){              
                //The increase in price is at least how much the user specified (priceIncreasePer).                   
                if(this.settings.changeinPricePer >= (this.settings.thresholds.priceIncreasePer)){
                    //Increment the persistence value as the trend continued for another candle.                      
                    if(this.buyPricePersistence){
                        this.buyPricePersistence = this.buyPricePersistence +1;
                    }
                    else{
                        this.buyPricePersistence = 1;
                    }            
                    //Compare actual buy persistence to buy persistence threshold.
                    log.debug('Price: Actual Buy Persistence: ', this.buyPricePersistence, ' Persistence Threshold: ', this.settings.buyPricePersistenceThreshold);              
                    //User selected to buy when the price increased by at least the specified %, the trend held, and advice has not yet been given for this candle.
                    if((this.settings.adviceGiven == 'no') && (this.buyPricePersistence >= this.settings.buyPricePersistenceThreshold)){
                        //Assess whether a purchase should be made, and if so, buy.
                        this.assessBuy(this.candle);                      
                    }    
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.buyPricePersistence = 0;
                }    
            }//end if buyIfPrice = increase
            //User wants to sell when there's been an increase in price in terms of %.               
            if (this.settings.sellIfPrice == 'increase'){
                //The increase in price is at least how much the user specified (priceIncreasePer).               
                if(this.settings.changeinPricePer >= (this.settings.thresholds.priceIncreasePer)){
                    //Increment the persistence value as the trend continued for another candle.                       
                    if(this.sellPricePersistence){
                        this.sellPricePersistence = this.sellPricePersistence +1;
                    }
                    else{
                        this.sellPricePersistence = 1;
                    }    
                    //Compare actual sell persistence to sell persistence threshold.
                    log.debug('Price: Actual Sell Persistence: ', this.sellPricePersistence, ' Persistence Threshold: ', this.settings.sellPricePersistenceThreshold);           
                    //User selected to sell when the price increased by at least the specified %, the trend held, and advice has not yet been given for this candle. 
                    if( (this.settings.adviceGiven == 'no') && (this.sellPricePersistence >= this.settings.sellPricePersistenceThreshold)){
                        //Assess whether a sale should be made, and if so, sell.
                        this.assessSell(this.candle);
                    }    
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.sellPricePersistence = 0;
                }
            }//end if sellIfPrice = increase                    
            
        } // end changeType = %
    } //end tradeFactors = price
    
    //User selected specific price thresholds as the trade factor.
    if(this.settings.tradeFactors == 'thresholds'){
        //Candle's close value is less than or equal to user's specified buy threshold, advice has not yet been given, and the next action to complete is a buy, so buy.
        if((this.settings.adviceGiven == 'no') && (this.settings.nextActionBuy == 'yes') ){
            if (candle.close <= (this.settings.thresholds.buyPriceThreshold)){
                this.adviseBuy(this.candle);     
            }
        }
        //Candle's close value is greater than or equal to user's specified sell threshold, advice has not yet been given, and the next action to complete is a sell, so sell.                
        else if( (this.settings.adviceGiven == 'no') && (this.settings.nextActionSell == 'yes')){
            if (candle.close >=this.settings.thresholds.sellPriceThreshold){                          
                this.adviseSell(this.candle);
            }
        }       
    }//end tradeFactors = thresholds
    
    //User selected trade volume or price&volume as trade factor(s).
    if((this.settings.tradeFactors == 'volume') || (this.settings.tradeFactors == 'price&volume') ){
        //User is looking at numerical changes (as opposed to %).
        if(this.settings.changeType == '#'){
            //User wants to buy when there's been a decrease in trade volume in terms of amount.
            if (this.settings.buyIfVol == 'decrease'){
                //The decrease in trade volume is at least how much the user specified (tradeVolDecreaseAmt).
                if(this.settings.changeinTradeVolAmt <= (this.settings.thresholds.tradeVolDecreaseAmt * -1)){
                    //Increment the persistence value as the trend continued for another candle.
                    if(this.buyVolPersistence){
                        this.buyVolPersistence = this.buyVolPersistence +1;
                    }
                    else{
                        this.buyVolPersistence = 1;
                    }
                    //Compare actual buy persistence to buy persistence threshold.                    
                    log.debug('Volume: Actual Buy Persistence: ', this.buyVolPersistence, ' Persistence Threshold: ', this.settings.buyVolPersistenceThreshold);                    
                    //User selected to buy when the trade volume decreased by at least the specified amount, the trend held, and advice has not yet been given for this candle.            
                    if((this.settings.adviceGiven == 'no') && (this.buyVolPersistence >= this.settings.buyVolPersistenceThreshold)){
                        //Assess whether a purchase should be made, and if so, buy.
                        this.assessBuy(this.candle);  
                    }
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.buyVolPersistence = 0;
                }
            } // end buyIfVol = decrease
            
            //User wants to sell when there's been a decrease in trade volume in terms of amount.
            if (this.settings.sellIfVol == 'decrease'){  
                //The decrease in trade volume is at least how much the user specified (tradeVolDecreaseAmt).             
                if(this.settings.changeinTradeVolAmt <= (this.settings.thresholds.tradeVolDecreaseAmt * -1)){
                    //Increment the persistence value as the trend continued for another candle.                    
                    if(this.sellVolPersistence){
                        this.sellVolPersistence = this.sellVolPersistence +1;
                    }
                    else{
                        this.sellVolPersistence = 1;
                    }
                    //Compare actual sell persistence to sell persistence threshold.                     
                    log.debug('Volume: Actual Sell Persistence: ', this.sellVolPersistence, ' Persistence Threshold: ', this.settings.sellVolPersistenceThreshold);                    
                    //User selected to sell when the trade volume decreased by at least the specified amount, the trend held, and advice has not yet been given for this candle.           
                    if((this.settings.adviceGiven == 'no') && (this.sellVolPersistence >= this.settings.sellVolPersistenceThreshold) ){     
                        this.assessSell(this.candle);
                    }                    
                }
                //The trend didn't continue, so reset the actual persistence value.                
                else{
                    this.sellVolPersistence = 0;
                }
            } // end sellIfVol = decrease
            //User wants to buy when there's been an increase in trade volume in terms of amount.            
            if (this.settings.buyIfVol == 'increase'){              
                //The increase in trade volume is at least how much the user specified (tradeVolIncreaseAmt).                   
                if(this.settings.changeinTradeVolAmt >= (this.settings.thresholds.tradeVolIncreaseAmt)){
                    //Increment the persistence value as the trend continued for another candle.                      
                    if(this.buyVolPersistence){
                        this.buyVolPersistence = this.buyVolPersistence +1;
                    }
                    else{
                        this.buyVolPersistence = 1;
                    }         
                    //Compare actual buy persistence to buy persistence threshold.
                    log.debug('Volume: Actual Buy Persistence: ', this.buyVolPersistence, ' Persistence Threshold: ', this.settings.buyVolPersistenceThreshold);              
                    //User selected to buy when the trade volume increased by at least the specified amount, the trend held, and advice has not yet been given for this candle. 
                    if((this.settings.adviceGiven == 'no') && (this.buyVolPersistence >= this.settings.buyVolPersistenceThreshold)){   
                        //Assess whether a purchase should be made, and if so, buy.
                        this.assessBuy(this.candle);  
                    }    
                }
                //The trend didn't continue. so reset the actual persistence value.
                else{
                    this.buyVolPersistence = 0;
                }    
            }//end if buyIfVol = increase
            //User wants to sell when there's been an increase in trade volume in terms of amount.               
            if (this.settings.sellIfVol == 'increase'){
                //The increase in trade volume is at least how much the user specified (tradeVolIncreaseAmt).                
                if(this.settings.changeinTradeVolAmt >= (this.settings.thresholds.tradeVolIncreaseAmt)){
                    //Increment the persistence value as the trend continued for another candle.                       
                    if(this.sellVolPersistence){
                        this.sellVolPersistence = this.sellVolPersistence +1;
                    }
                    else{
                        this.sellVolPersistence = 1;
                    }    
                    //Compare actual sell persistence to sell persistence threshold.
                    log.debug('Volume: Actual Sell Persistence: ', this.sellVolPersistence, ' Persistence Threshold: ', this.settings.sellVolPersistenceThreshold);           
                    //User selected to sell when the trade volume increased by at least the specified amount, the trend held, and advice has not yet been given for this candle. 
                    if( (this.settings.adviceGiven == 'no') && (this.sellVolPersistence >= this.settings.sellVolPersistenceThreshold)){   
                        //Assess whether a sale should be made, and if so, sell.
                        this.assessSell(this.candle);
                    }    
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.sellVolPersistence = 0;
                }  
            }//end if sellIfVol = increase           
        }//end changeType = #
        
        //User is looking at % changes (as opposed to amount).        
        else if(this.settings.changeType == '%'){
            //User wants to buy when there's been a decrease in trade volume in terms of %.
            if (this.settings.buyIfVol == 'decrease'){
                //The % decrease in trade volume is at least how much the user specified (tradeVolDecreasePer).
                if(this.settings.changeinTradeVolPer <= (this.settings.thresholds.tradeVolDecreasePer *-1)){ 
                    //Increment the persistence value as the trend continued for another candle.
                    if(this.buyVolPersistence){
                        this.buyVolPersistence = this.buyVolPersistence +1;
                    }
                    else{
                        this.buyVolPersistence = 1;
                    }
                    //Compare actual buy persistence to buy persistence threshold.
                    log.debug('Volume: Actual Buy Persistence: ', this.buyVolPersistence, ' Persistence Threshold: ', this.settings.buyVolPersistenceThreshold);                    
                    //User selected to buy when the trade volume decreased by at least the specified %, the trend held, and advice has not yet been given for this candle.            
                    if((this.settings.adviceGiven == 'no') && (this.buyVolPersistence >= this.settings.buyVolPersistenceThreshold)){
                        //Assess whether a purchase should be made, and if so, buy.
                        this.assessBuy(this.candle);                      
                    }
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.buyVolPersistence = 0;
                }
            } // end buyIfVol = decrease
            
            //User wants to sell when there's been a decrease in trade volume in terms of %.
            if (this.settings.sellIfVol == 'decrease'){  
                //The % decrease in trade volume is at least how much the user specified (tradeVolDecreasePer).                
                if(this.settings.changeinTradeVolPer <= (this.settings.thresholds.tradeVolDecreasePer *-1)){ 
                    //Increment the persistence value as the trend continued for another candle                    
                    if(this.sellVolPersistence){
                        this.sellVolPersistence = this.sellVolPersistence +1;
                    }
                    else{
                        this.sellVolPersistence = 1;
                    }
                    //Compare actual sell persistence to sell persistence threshold.
                    log.debug('Volume: Actual Sell Persistence: ', this.sellVolPersistence, ' Persistence Threshold: ', this.settings.sellVolPersistenceThreshold);                    
                    //User selected to sell when the trade volume decreased by at least the specified %, the trend held, and advice has not yet been given for this candle.                  
                    if((this.settings.adviceGiven == 'no') && (this.sellVolPersistence >= this.settings.sellVolPersistenceThreshold) ){  
                        //Assess whether a sale should be made, and if so, sell.
                        this.assessSell(this.candle);
                    }                    
                }
                //The trend didn't continue, so reset the actual persistence value.                
                else{
                    this.sellVolPersistence = 0;
                }
            } // end sellIfVol = decrease
            //User wants to buy when there's been an increase in trade volume in terms of %.            
            if (this.settings.buyIfVol == 'increase'){              
                //The increase in trade volume is at least how much the user specified (tradeVolIncreasePer).                   
                if(this.settings.changeinTradeVolPer >= (this.settings.thresholds.tradeVolIncreasePer)){
                    //Increment the persistence value as the trend continued for another candle.                      
                    if(this.buyVolPersistence){
                        this.buyVolPersistence = this.buyVolPersistence +1;
                    }
                    else{
                        this.buyVolPersistence = 1;
                    }                    
                    //Compare actual buy persistence to buy persistence threshold.
                    log.debug('Volume: Actual Buy Persistence: ', this.buyVolPersistence, ' Persistence Threshold: ', this.settings.buyVolPersistenceThreshold);              
                    //User selected to buy when the trade volume increased by at least the specified %, the trend held, and advice has not yet been given for this candle. 
                    if((this.settings.adviceGiven == 'no') && (this.buyVolPersistence >= this.settings.buyVolPersistenceThreshold)){    
                        //Assess whether a purchase should be made, and if so, buy.
                        this.assessBuy(this.candle);  
                    }    
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.buyVolPersistence = 0;
                }    
            }//end if buyIfVol = increase
            //User wants to sell when there's been an increase in trade volume in terms of %.               
            if (this.settings.sellIfVol == 'increase'){
                //The increase in trade volume is at least how much the user specified (tradeVolIncreasePer).                 
                if(this.settings.changeinTradeVolPer >= (this.settings.thresholds.tradeVolIncreasePer)){
                    //Increment the persistence value as the trend continued for another candle.                       
                    if(this.sellVolPersistence){
                        this.sellVolPersistence = this.sellVolPersistence +1;
                    }
                    else{
                        this.sellVolPersistence = 1;
                    }    
                    //Compare actual sell persistence to sell persistence threshold.
                    log.debug('Volume: Actual Sell Persistence: ', this.sellVolPersistence, ' Persistence Threshold: ', this.settings.sellVolPersistenceThreshold);           
                    //User selected to sell when the trade volume increased by at least the specified %, the trend held, and advice has not yet been given for this candle. 
                    if( (this.settings.adviceGiven == 'no') && (this.sellVolPersistence >= this.settings.sellVolPersistenceThreshold)){ 
                        //Assess whether a sale should be made, and if so, sell.
                        this.assessSell(this.candle);
                    }    
                }
                //The trend didn't continue, so reset the actual persistence value.
                else{
                    this.sellVolPersistence = 0;
                }
            }//end if sellIfVol = increase                    
        } // end changeType = %
    }//end selectedTradeVol   
    
    //User selected to make trade decisions based on changes in both price and volume. Both the price persistence threshold and the volume persistence threshold must be met (indicating the appropriate price and volume trends have occurred), before a buy or sell can be completed.
    if(this.settings.tradeFactors == 'price&volume'){
        //Next action is to sell, the sellVolPersistence and sellPricePersistence thresholds have been reached.
        if((this.settings.nextActionSell == 'yes') && (this.sellVolPersistence >= this.settings.sellVolPersistenceThreshold) && (this.sellPricePersistence >= this.settings.sellPricePersistenceThreshold)){
            //Make a sale.
            this.adviseSell(this.candle);
        }
        //Next action is to buy, the buyVolPersistence and buyPricePersistence thresholds have been reached.
        else if((this.settings.nextActionBuy == 'yes') && (this.buyVolPersistence >= this.settings.buyVolPersistenceThreshold) && (this.buyPricePersistence >= this.settings.buyPricePersistenceThreshold)){
            //Make a purchase.
            this.adviseBuy(this.candle);
        }        
    }  
}// end check

module.exports = strat;