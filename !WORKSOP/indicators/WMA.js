//WMA port by Gab0 - 03/29/2018;

var Indicator = function(windowLength) {
    this.input = 'price';
    this.windowLength = windowLength;
    this.prices = [];
    this.result = 0;
    this.age = 0;
    this.sum = 0;
}

Indicator.prototype.update = function(price) {
    var tail = this.prices[this.age] || 0; // oldest price in window
    this.prices.push(price);


    var psum =0;
    var pdiv = 0;

    for (var j=0;j<this.prices.length;j++)
    {

        psum += j * this.prices[j];
        pdiv += j;

    }

    this.result = psum/pdiv;
    if (this.prices.length > this.windowLength)
    {
        this.prices.shift()

    }

    this.age = (this.age + 1) % this.windowLength
}

module.exports = Indicator;
