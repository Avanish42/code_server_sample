var Promise = require('promise'),
    AchievementsManager = require('../modules/achievements-manager'),
    CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  var Review = app.models.Review,
      User = app.models.UserModel;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var userId = String(req.accessToken.userId);

    Review.findById(req.params.id, function(err, review) {

      if (err || !review) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Review not found',
          errors: []
        });

        return;
      }

      !review.likes && (review.likes = []);
      if (review.likes.indexOf(userId) === -1) {
        review.likes.indexOf(userId) === -1 && review.likes.push(userId);
        review.save(function(err) {
          if (CheckSave(err, res)) {
            req.accessToken.user(function(err, iUser) {
              if (err || !iUser) {
                res.status(404);
                res.json({
                  code: '000-404',
                  message: 'User not found',
                  errors: []
                });

                return;
              }

              // Added own like to profile
              var likeId = 'review_' + review.id;
              if (iUser.likes.indexOf(likeId) === -1) {
                iUser.likes.push(likeId);
              }

              iUser.save(function(err) {
                if (CheckSave(err, res)) {

                  // SYSTEM NOTIFICATION
                  User.emit('systemSend', {
                    state: 'reviewLike',
                    review: review,
                    follower: iUser
                  });

                  var setAchievementPromiseFirst = new Promise(function(resolve, reject) {
                    AchievementsManager({
                      type: 'add_like',
                      user: iUser,
                      resolve: resolve
                    });
                  });

                  setAchievementPromiseFirst.then(function(response) {
                    //
                    User.findById(review.authorId, function(err, remoteUser) {
                      if (err || !remoteUser) {
                        res.status(404);
                        res.json({
                          code: '000-404',
                          message: 'User not found',
                          errors: []
                        });

                        return;
                      }

                      var setAchievementPromiseSecond = new Promise(function(resolve, reject) {
                        AchievementsManager({
                          type: 'added_like_on_review',
                          user: remoteUser,
                          review: review,
                          resolve: resolve
                        });
                      });

                      setAchievementPromiseSecond.then(function(response) {
                        res.json({
                          code: 0,
                          data: null
                        });
                      });
                    });
                    //
                  });

                }
              })
            });
          }
        });
      } else {
        res.json({
          code: 0,
          data: null
        });
      }

    });
  });


  /*
  // DELETE
  */
  app.delete(options.url, function(req ,res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var userId = req.accessToken.userId + '';

    Review.findById(req.params.id, function(err, review) {

      if (err || !review) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Review not found',
          errors: []
        });

        return;
      }

      if (review.likes && review.likes.length && review.likes.indexOf(userId) !== -1) {
        review.likes = review.likes.filter(function(reviewItem) {
          if (reviewItem !== userId) {
            return reviewItem;
          }
        });
        review.save(function(err) {
          if (CheckSave(err, res)) {

            req.accessToken.user(function (err, iUser) {
              if (err || !iUser) {
                res.status(404);
                res.json({
                  code: '000-404',
                  message: 'User not found',
                  errors: []
                });

                return;
              }

              // Remove own like from profile
              var likeId = 'review_' + review.id;
              if (iUser.likes.indexOf(likeId) !== -1) {
                iUser.likes = iUser.likes.filter(function (likeIdItem) {
                  if (likeIdItem !== likeId) {
                    return likeIdItem;
                  }
                });
              }

              iUser.save(function (err) {
                if (CheckSave(err, res)) {
                  res.json({
                    code: 0,
                    data: null
                  });
                }
              });
            });

          }
        });
      } else {
        res.json({
          code: 0,
          data: null
        });
      }
    });
  });
};
