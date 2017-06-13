var Promise = require('promise'),
    filterParser = require('../modules/filter-parser'),
    AchievementsManager = require('../modules/achievements-manager'),
    CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function(app, options) {

  var Brand = app.models.Brand,
      Review = app.models.Review;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var limit = parseInt(req.query.pageSize) || 10,
        skip = (parseInt(req.query.page) - 1 || 0) * limit,
        reqParams = {
          limit: limit,
          skip: skip,
          where: {},
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
                fields: ['id', 'title', 'countries']
              }
            }
          ],
          order: 'createdAt DESC'
        };

    if (req.query.withText) {
      reqParams.where.text = {regexp: '.'};
    }

    if (req.query.withImages) {
      reqParams.where.images = {
        gt: []
      };
    }

    if (req.query.withComments) {
      reqParams.where.comments = {regexp: '.'};
    }

    if (req.query.filter) {
      reqParams.where = filterParser(req.query.filter);
    }

    if (req.query.query) {
      !reqParams.where && (reqParams.where = {});
      reqParams.where.text = {regexp: req.query.query + '/i'};
    }

    reqParams.where.brandId = req.params.id;

    req.accessToken.user(function (err, user) {
      if (err || !user) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'User not found',
          errors: []
        });

        return;
      }

      // GET AVAILABLE COUNTRY*
      CheckCountryOnBrands(user.address.countryCode, function(err, country) {
        var availableReviews = [];

        //
        Review.find(reqParams, function(err, reviews) {
          !reviews && (reviews = []);

          if (reviews.length) {
            availableReviews = reviews.filter(function(review) {
              return review.toJSON().brand.countries.indexOf(country) !== -1
            });
          }

          res.json({
            code: 0,
            data: availableReviews.length ? sortBy(availableReviews, 'position') : availableReviews
          });
        });
      });
    });

    // Support FNCs
    function sortBy(items, by) {
      if (!items || !by) {
        return items;
      }

      var A = items,
          n = items.length;

      for (var i = 0; i < n-1; i++) {
        for (var j = 0; j < n-1-i; j++) {
          var x = parseInt(A[j+1][by]) || 0,
              y = parseInt(A[j][by]) || 0;

          x < 0 && (x = (100000 + x) * -1);
          x > 0 && (x = (100000 - x));
          y < 0 && (y = (100000 + y) * -1);
          y > 0 && (y = (100000 - y));

          if (x > y) {
            var t = A[j+1];
            A[j+1] = A[j];
            A[j] = t;
          }
        }
      }

      return items;
    }
  });


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

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

      var errors = [],
          hashtags = [],
          location;

      if (req.headers['x-device-id'] && user.settings.devices[req.headers['x-device-id']]) {
        location = {
          address: user.settings.devices[req.headers['x-device-id']].address,
          location: user.settings.devices[req.headers['x-device-id']].location
        };
      } else if (user.settings.devices[user.meta.deviceId]) {
        location = {
          address: user.settings.devices[user.meta.deviceId].address,
          location: user.settings.devices[user.meta.deviceId].location
        };
      } else {
        res.status(400);
        res.json({ code: '000-002', message: 'User location not exists', errors: errors });

        return;
      }

      if (req.body.images && !req.body.text) {
        if (!req.body.text) {
          errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'text' });
        }
      }

      if (!req.body.rate) {
        if (!req.body.rate) {
          errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'rate' });
        }
      }

      if (errors.length) {
        res.status(400);
        res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

        return;
      }

      if (req.body.text) {
        var hashArr = req.body.text.split('#');

        hashArr.forEach(function(item, index) {
          if (index === 0) { return }
          var hashtag = item.split(' ')[0].replace(/![^a-zA-Z0-9_-]/g, '');
          hashtag && hashtags.push(hashtag);
        });
      }

      var rate = +req.body.rate < 1 ? 1 : +req.body.rate,
          newReview = {
            authorId: req.accessToken.userId,
            brandId: req.params.id,
            text: req.body.text && req.body.text,
            rate: rate < 5 ? rate : 5,
            hashtags: hashtags,
            address: location.address,
            location: new app.loopback.GeoPoint(location.location),
            likes: [],
            comments: []
          };

      if (req.body.images && req.body.images.length) {
        newReview.images = req.body.images.map(function (image) {
          return image.replace(app.get('basePath'), '/');
        });
      }

      Brand.findById(newReview.brandId, function(err, brand) {
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

        // SET ROOT DATA
        newReview.categoryId = brand.categoryId;
        newReview.subcategoryId = brand.subcategoryId;

        // CREATE REVIEW
        Review.create(newReview, function(err, review) {
          if (CheckSave(err, res)) {

            // UPDATE BRAND
            // --SET BRAND AVERAGE RATE
            brand.reviews.push(review.id + '');
            brand.avgRateSum += newReview.rate;
            brand.avgRate = Math.round((brand.avgRateSum / brand.reviews.length) * 100) / 100;
            brand.updateAttributes({reviews: brand.reviews, avgRate: brand.avgRate, avgRateSum: brand.avgRateSum}, function(err, instance) {
              if (CheckSave(err, res)) {

                // UPDATE USER
                user.reviews.push(review.id + '');
                user.updateAttributes({reviews: user.reviews}, function(err, user) {
                  if (CheckSave(err, res)) {
                    if (err) {
                      res.status(400);
                      res.json({
                        code: '000-400',
                        message: err,
                        errors: []
                      });

                      return;
                    }

                    res.json({
                      code: 0,
                      data: {
                        id: review.id
                      }
                    });

                    var setAchievementPromise = new Promise(function(resolve, reject) {
                      AchievementsManager({
                        type: 'add_review',
                        user: user,
                        resolve: resolve
                      });
                    });

                    setAchievementPromise.then(function(err) {
                      if (req.body.tagedId) {
                        // SYSTEM NOTIFICATION TO TAGED
                        Brand.app.models.UserModel.emit('systemSend', {
                          state: 'tagedPost',
                          review: review,
                          follower: user,
                          usersId: req.body.tagedId
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });

    });
  });

};
