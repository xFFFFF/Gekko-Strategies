class MinMaxQueue {
    constructor(len) {
        this.max_queue = [];
        this.min_queue = [];
        this.length = len;
        this.i=0;
    }

    enqueue(element) {

        /* Deal with max queue */
        while(this.max_queue.length!==0 && this.max_queue[0][1] < this.i - this.length + 1) {
            this.max_queue.shift();
        }
        while(this.max_queue.length!==0 && this.max_queue[this.max_queue.length-1][0] < element) {
            this.max_queue.pop();
        }
        this.max_queue.push([element, this.i]);

        /* Deal with min queue */
        /*  */
        while(this.min_queue.length!==0 && this.min_queue[0][1] < this.i - this.length + 1) {
            this.min_queue.shift();
        }
        while(this.min_queue.length!==0 && this.min_queue[this.min_queue.length-1][0] >= element) {
            this.min_queue.pop();
        }
        this.min_queue.push([element, this.i]);

        this.i++;
    }

    get_max() {
        return this.max_queue[0][0];
    }

    get_min() {
        return this.min_queue[0][0];
    }
}

// Naive, slower version
// class MinMaxQueue {
//     constructor(len) {
//         this.max_queue = [];
//         this.min_queue = [];
//         this.length = len;
//         this.i=0;
//     }
//
//     enqueue(element) {
//         this.max_queue.push(element);
//         this.min_queue.push(element);
//
//         if(this.max_queue.length>this.length) {
//             this.max_queue.shift();
//         }
//
//         if(this.min_queue.length>this.length) {
//             this.min_queue.shift();
//         }
//     }
//
//     get_max() {
//         return Math.max(...this.max_queue);
//     }
//
//     get_min() {
//         return Math.min(...this.min_queue);
//     }
// }

var Indicator = function(config) {
    this.windowMin = Number.MAX_VALUE;
    this.windowMax = Number.MIN_VALUE;
    
    this.queue = new MinMaxQueue(config.histSize);    

    this.thresholds = [0, 0.236, 0.382, 0.5, 0.618, 1];
    this.thres_vals = [];
    this.line0 = 0;
    this.line23_6 = 0;
    this.line38_2 = 0;
    this.line50_0 = 0;
    this.line61_8 = 0;
    this.line100 = 0;
    
    /* Number of current candle */
    this.numCandle = 0;

    /* Size of the window we are gonna watch */
    this.histSize = config.histSize;

    /* How close is close to line, this.eps needs to be between 0 - 100*/
    this.eps_config = config.eps/100.0;
    
    this.eps = 0;
    
};

Indicator.prototype.update = function(candle) {
    // enqueue
    // max()
    // min()
    // config:window length
    
    this.queue.enqueue(candle.close);
    this.windowMin = this.queue.get_min();
    this.windowMax = this.queue.get_max();
    
    let diff = this.windowMax - this.windowMin;
    this.eps = diff*this.eps_config;
    
    this.thres_vals = [];
    for(let ind in this.thresholds) {
        this.thres_vals.push(this.thresholds[ind]*diff + this.windowMin);
    }
    
    
    //this.line0 = this.windowMin;
    //this.line23_6 = this.line0 + 0.236 * diff;
    //this.line38_2 = this.line0 + 0.382 * diff;
    //this.line50_0 = this.line0 + 0.5 * diff;
    //this.line61_8 = this.line0 + 0.618 * diff;
    //this.line100 = this.windowMax;
}


Indicator.prototype.calculate = function(candle) {
    
}

module.exports = Indicator;
