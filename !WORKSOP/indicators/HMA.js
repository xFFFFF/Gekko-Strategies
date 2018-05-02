// HMA ported by Gab0 03/29/2018;
var WMA = require('./WMA');

var Indicator = function (weight) {
    this.input = 'price';
    this.Twma = new WMA(weight);
    this.Bwma = new WMA(weight/2);
    this.Mwma = new WMA(Math.sqrt(weight));
    this.weight = weight;
    this.prices = [];
    this.result = 0;
    this.age = 0;
}

Indicator.prototype.update = function (price) {
    this.prices[this.age] = price;

    this.Twma.update(price);
    this.Bwma.update(price);


    var Mwmafeed = (2 * this.Bwma.result) - this.Twma.result;
    this.Mwma.update(Mwmafeed);

    this.result = this.Mwma.result;

    this.age++;
}

module.exports = Indicator;
