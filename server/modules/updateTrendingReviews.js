var async = require('async'),
    helper = require('./helper'),
    app = require('../server');

module.exports = function() {

  var Review = app.models.Review;

  /*
   * FIND AND UPDATE TRENDING REVIEWS
   */
  var findUpdateTrendingReview = function() {
    Review.updateAll({'trending.index': {gt: -1}}, {'trending.index': null}, function(err, info) {
      if (err) {
        return
      }

      Review.find({where: {or: [{comments: {regexp: "."}}, {likes: {regexp: "."}}]}}, function (err, reviews) {
        if (err || !reviews || !reviews.length) {
          return;
        }

        var dataList = reviews.map(function (review) {
          return {
            id: String(review.id),
            weight: review.comments.length >= review.likes.length ? review.comments.length : review.likes.length
          }
        });

        var sortedByCommentsList = helper.sortBy(dataList, ['weight']);
        var ids4Update = sortedByCommentsList.map(function (item) { return String(item.id) }).slice(0, app.get('trendingReviews').maxReviews);
        var tasks = [];

        reviews.forEach(function (review) {
          var currentIndex = ids4Update.indexOf(String(review.id));
          if (currentIndex !== -1) {
            var task = function (cb) {
              review.updateAttributes({'trending.index': currentIndex}, function (err, instance) {
                cb(err, instance);
              });
            };

            tasks.push(task);
          }
        });

        async.parallel(tasks, function (err, results) {
          console.log('UPDATED TRENDING REVIEWS LIST: ', { count: results.length });
        });
      });
    });
  }();

};
