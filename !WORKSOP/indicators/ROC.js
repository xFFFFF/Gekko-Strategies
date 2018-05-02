// ROC indicator, ported by Gab0
// 10-april-2018 v1.0final

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
    this.prices[this.age] = price;


    this.result = ((price - tail) / tail) * 100
    this.age = (this.age + 1) % this.windowLength
}

module.exports = Indicator;
