// STC coded by Gab0 03/29/2018;
//settings: short, long, signal, cycle, smooth;
var MACD = require('./MACD');
var STOCH = require('./STOCH');

var Indicator = function (settings) {
    this.input = 'price';

    this.signal = new MACD({'short': settings.short,
                            'long': settings.long,
                            'signal': settings.signal});

    this.MACDs = [];
    this.PFs = [];
    this.Frac1 = 0;
    this.Frac2 = 0;
    this.Cycle = settings.cycle;
    this.Factor = settings.smooth;
    this.age = 0;
};

Indicator.prototype.getMin = function (data) {
    var minimum = 9999999;
    for (var z=0; z < data.length; z++)
    {
        minimum = Math.min(minimum, data[z]);
    }
    return minimum;
};

Indicator.prototype.getMax = function(data) {
    var maximum = -99999999;
    for (var z=0; z < data.length; z++)
    {
        maximum = Math.max(maximum, data[z]);
    }
    return maximum;
};
Indicator.prototype.Stoch = function(data, newvalue, previousStoch) {
    // PREVIOUS VALUES MANAGEMENT;
    data.push(newvalue);
    if (data.length > this.Cycle) {
        data.shift();
    }

    // FIRST VARIABLES PROCESSING
    var x = this.getMin(data);
    var y = this.getMax(data) - x;

    // CALCULATE FastK;
    if (y > 0) {
        var output = ((newvalue - x) / y) * 100;
    }
    else {
        var output = previousStoch;
    }

    //console.log('STOCH VARS>>', newvalue, output, x, y);
    return output;
}
Indicator.prototype.wellesSmooth = function(prevStoch, Default) {

    if (this.age <= 1) {
        var stoch = Default;
    }
    else {
        var stoch = prevStoch + (this.Factor * (Default - prevStoch));
    }
    return stoch;
};

Indicator.prototype.update = function (price) {

    this.signal.update(price);
    //console.log(this.signal.result);


    // FIRST STOCHASTIC;
    this.Frac1 = this.Stoch(this.MACDs, this.signal.result, this.Frac1);
    console.log(this.MACDs);
    // Smooth, FastD for MACD;
    this.PF = this.wellesSmooth(this.PF, this.Frac1);

    // SECOND STOCHASTIC;
    this.Frac2 = this.Stoch(this.PFs, this.PF, this.Frac2);

    // Smooth, FastD for PF;
    this.PFF = this.wellesSmooth(this.PFF, this.Frac2);

    // RESULT;
    this.result = this.PFF;


}

module.exports = Indicator;
