var Indicator = function() {
  this.input = 'candle';

  this.renkoClose = null;
  this.renkoOpen = null;

  this.direction = 'none'
}

Indicator.prototype.update = function(candle) {
  // First Renko
  if(this.renkoClose != null){

    // First Goes UP or up
    if((this.renkoClose >= candle.close+50 && this.direction == 'none') || (this.renkoClose >= candle.close+50 && this.direction == 'up') ){
      this.renkoOpen = this.renkoClose;
      this.renkoClose += 50;
      this.direction = 'up';
    }

    // First Goes Down or down
    if((this.renkoClose <= candle.close-50 && this.direction == 'none') || (this.renkoClose <= candle.close-50 && this.direction == 'down') ){
      this.renkoOpen = this.renkoClose;
      this.renkoClose -= 50;
      this.direction = 'down'
    }

    // From up to down
    if(this.renkoClose <= candle.close-100 && this.direction == 'up'){
      //this.renkoOpen = this.renkoOpen;
      this.renkoClose = this.renkoClose-100;
      this.direction = 'down';
    }

    // From down to up
    if(this.renkoClose >= candle.close+100 && this.direction == 'down'){
      //this.renkoOpen = this.renkoOpen;
      this.renkoClose = this.renkoClose+100;
      this.direction = 'up';
    }

  } else
  this.renkoClose = candle.close; // First Renko



}

module.exports = Indicator;
