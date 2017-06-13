var CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  var Review = app.models.Review;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    //
    var reqParams = {
      where: req.params,
      include: [
        {
          relation: 'user',
          scope: {
            fields: ['username', 'firstName', 'lastName', 'photo']
          }
        },
        {
          relation: 'brand',
          scope: {
            fields: ['id', 'title', 'image', 'avgRate']
          }
        }
      ]
    };
    //

    Review.findOne(reqParams, function (err, review) {

      if (err || !review) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Review not found',
          errors: []
        });

        return;
      }

      var reviewJSON = review.toJSON();
      reviewJSON.likesCount = reviewJSON.likes.length;
      reviewJSON.commentsCount = reviewJSON.comments.length;

      res.json({
        code: 0,
        data: reviewJSON
      })

    });

  });


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

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

      review.brand(function(err, brand) {

        if (err || !brand) {
          res.status(404);
          res.json({
            code: '000-404',
            message: 'Brand not found',
            errors: []
          });

          return;
        }

        // CHECK STATE
        if ('accepted' !== brand.state && brand.state !== 'added_by_admin') {
          res.status(404);
          res.json({
            code: '000-400',
            message: 'Brand not approved',
            errors: []
          });

          return;
        }

        var bodyKeys = Object.keys(req.body),
            availableFields = ['text', 'rate', 'images', 'hashtags'],
            reviewUpdated = {},
            hasChanges = false,
            rateChanges = false,
            hashtags = [];

        for (var i = 0; i < bodyKeys.length; i++) {
          if (availableFields.indexOf(bodyKeys[i]) !== -1 && req.body[bodyKeys[i]]) {
            hasChanges = true;
            if (bodyKeys[i] === 'rate') {
              var rate = +req.body.rate < 1 ? 1 : +req.body.rate;
              reviewUpdated[bodyKeys[i]] = rate < 5 ? rate : 5;
              rateChanges = true;
            } else if (bodyKeys[i] === 'images' && req.body[bodyKeys[i]].length) {
              reviewUpdated[bodyKeys[i]] = req.body[bodyKeys[i]].map(function (item) {
                return item.replace(app.get('basePath'), '/');
              });
            } else {
              reviewUpdated[bodyKeys[i]] = req.body[bodyKeys[i]];
            }
          }
        }

        if (hasChanges) {
          req.accessToken.user(function(err, user) {

            if (err || !user) {
              res.status(404);
              res.json({
                code: '000-404',
                message: 'User not found',
                errors: []
              });

              return;
            }

            // SET BRAND AVERAGE RATE
            if (brand.reviews.length > 1) {
              brand.avgRateSum -= review.rate;
            } else {
              brand.avgRateSum = 0;
            }
            brand.avgRateSum += reviewUpdated.rate;
            brand.avgRate = Math.round((brand.avgRateSum / brand.reviews.length) * 100) / 100;

            // SET HASHTAGS
            if (req.body.text) {
              var hashArr = req.body.text.split('#');

              hashArr.forEach(function(item, index) {
                if (index === 0) { return }
                var hashtag = item.split(' ')[0].replace(/![^a-zA-Z0-9_-]/g, '');
                hashtag && hashtags.push(hashtag);
              });

              reviewUpdated.hashtags = hashtags;
            }

            //REVIEW UPDATE
            review.updateAttributes(reviewUpdated, function(err, instance) {
              if (CheckSave(err, res)) {
                if (req.body.tagedId) {

                  // SYSTEM NOTIFICATION TO TAGED
                  Review.app.models.UserModel.emit('systemSend', {
                    state: 'tagedPost',
                    review: instance,
                    follower: user,
                    usersId: req.body.tagedId
                  });
                }

                if (rateChanges) {
                  brand.updateAttributes({avgRate: brand.avgRate, avgRateSum: brand.avgRateSum}, function(err, instance) {
                    if (CheckSave(err, res)) {
                      res.json({
                        code: 0,
                        data: {
                          id: review.id
                        }
                      });
                    }
                  });
                } else {
                  res.json({
                    code: 0,
                    data: {
                      id: review.id
                    }
                  });
                }
              }
            });

          });
        } else {
          res.status(400);
          res.json({ code: '000-002', message: 'Required field(s) are empty', errors: [] });
        }
      });
    });
  });


  /*
  // DELETE
  */
  app.delete(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    Review.findById(req.params.id, function (err, review) {

      if (err || !review) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Review not found',
          errors: []
        });

        return;
      }

      if (String(review.authorId) !== String(req.accessToken.userId)) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'You are not owner',
          errors: []
        });

        return;
      }

      Review._delete(req.params.id, function (err, info) {
        if (err) {
          res.status(500);
          res.json({
            code: '000-500',
            message: 'Destroy review is failed',
            errors: []
          });

          return;
        }

        res.json({
          code: 0,
          data: null
        });
      });
    });
  });
};
