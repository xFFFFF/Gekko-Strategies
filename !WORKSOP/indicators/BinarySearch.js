// http://en.wikipedia.org/wiki/Binary_search_algorithm
// this implementation by kuzetsa, 2014 July 13
// working code has existed for over 50 years
// I'm only mostly sure this is bug-free...

var ArrayWrapper = function(arrayToSearch) {
  // "Array" object primative is case sensitive,
  // but just to be clear, CamelCaseVerbosely
  this.arrayToSearch = arrayToSearch;
};

ArrayWrapper.prototype.BinarySearch = function(value) {

  var high = this.arrayToSearch.length - 1; // off by one
  var low = 0;
  var pivot = 0;
  var WhatIsHere = 0;

  while (low <= high) {

    // It's fast to use >>> operator for an
    // unsigned 32-bit binary shift right...
    // the number of minutes you can express
    // in 32 bits is thousands of YEARS!!!

    /*jshint bitwise: false */
    pivot = low + ((high - low) >>> 1); // was NOT a typo, jshint!!!
    WhatIsHere = this.arrayToSearch[pivot];

    if (WhatIsHere < value) {
      low  = pivot + 1; // "lower bound" adjustment
    } else if (WhatIsHere > value) {
      high = pivot - 1; // "upper bound" adjustment
    } else {
      return pivot; // neither less, nor greater than.
    }
  }
  return pivot; // high and low crashed into each other
  // a best-effort attempt was made, so just go with it
  // we're here now, assume it's "close enough", right?
};

module.exports = ArrayWrapper;
