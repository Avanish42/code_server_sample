var CronJob = require('cron').CronJob;
var config = require('../config');
var updateBrandTrendingRate = require('../modules/updateBrandTrendingRate');
var updateTrendingReviews = require('../modules/updateTrendingReviews');

//
var job1 = new CronJob({
  cronTime: '00 00 00 * * 0',
  onTick: function() {
    updateBrandTrendingRate();
  },
  start: false,
  timeZone: config.timeZone
});

//
var job2 = new CronJob({
  cronTime: '00 */30 * * * *',
  onTick: function() {
    updateTrendingReviews();
  },
  start: false,
  timeZone: config.timeZone
});


job1.start();
job2.start();
