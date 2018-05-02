function simple_moving_averager(period) {
  var nums = [];
  return function (num) {
    nums.push(num);
    if (nums.length > period)
      nums.splice(0, 1);
    var sum = 0;
    for (var i in nums)
      sum += nums[i];
    var n = period;
    if (nums.length < period)
      n = nums.length;
    return (sum / n);
  };
}

module.exports = simple_moving_averager;
