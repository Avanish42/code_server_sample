var CheckToken = require('../modules/check-token'),
    helper = require('../modules/helper');

module.exports = function(app, options) {

  var Review = app.models.Review;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var distance = app.get('reviewsDistance'),
        conditionLocation;

    req.accessToken.user(function(err, user) {
      var errors = [];

      if (req.query.lat && req.query.lng) {
        conditionLocation = {lat: parseFloat(req.query.lat), lng: parseFloat(req.query.lng)};
      } else if (req.headers['x-device-id'] && user.settings.devices[req.headers['x-device-id']]) {
        conditionLocation = user.settings.devices[req.headers['x-device-id']].location;
      } else if (user.settings.devices[user.meta.deviceId]) {
        conditionLocation = user.settings.devices[user.meta.deviceId].location;
      } else {
        res.status(400);
        res.json({ code: '000-002', message: 'User location not exists', errors: errors });

        return;
      }

      var reqParams = {
        where: {
          location: {near: conditionLocation},
          authorId: {neq: user.id}
        },
        order: 'createdAt DESC',
        include: [
          {
            relation: 'user',
            scope: {
              fields: ['id','username','email','firstName','lastName','dob','gender','photo']
            }
          },
          {
            relation: 'brand',
            scope: {
              include: [
                {
                  relation: 'getReviews',
                  scope: {
                    fields: ['id'],
                    where: {
                      text: {regexp: /./}
                    }
                  }
                },
                {
                  relation: 'subcategory',
                  scope: {
                    fields: ['id', 'title']
                  }
                }
              ]
            }
          }
        ]
      };

      if (req.query.withText) {
        reqParams.where.text = {regexp: /./};
      }

      if (distance && Object.keys(distance).length) {
        for (var pName in distance) {
          if (distance.hasOwnProperty(pName)) {
            reqParams.where.location[pName] = distance[pName];
          }
        }
      }

      Review.find(reqParams, function(err, reviews) {
        var limit = parseInt(req.query.pageSize) || 10,
            skip = (parseInt(req.query.page) - 1 || 0) * limit,
            nearest = [],
            reviews4Print = [];

        reviews.forEach(function(review) {
          if (!review.location || !review.brand) { return; }

          if (review.brand.state === 'accepted' || 'added_by_admin' === review.brand.state) {
            var review4Print = helper.mask(review, 'id,authorId,brandId,text,rate,images,comments,likes,brand,createdAt,modifiedAt');

            review4Print.location = {
              country: review.address.country,
              city:    review.address.city,
              lat:     review.location.lat,
              lng:     review.location.lng
            };

            if (review.user) {
              review4Print.user = helper.mask(review.user, 'id,username,email,firstName,lastName,dob,gender,photo');
            }

            if (review.brand) {
              review.brand.reviewsWithTextSum = review.brand.getReviews.length;
              review.brand.reviewsRatedSum = review.brand.reviews.length - review.brand.getReviews.length;
            }

            nearest.push(review4Print);
          }
        });

        nearest = sortBy(nearest, 'createdAt', false);

        // Echo Skip Reviews
        for (var i = skip; i <= skip + limit; i++) {
          if (!nearest[i] || i > skip + limit - 1) {
            res.json({
              code: 0,
              data: reviews4Print
            });
            return;
          } else {
            reviews4Print.push(nearest[i]);
          }
        }

        res.json({
          code: 0,
          data: reviews4Print
        });
      });

    });
  });

  // SUPPORT FNC`s
  function sortBy(items, param, direct) {
    if (!items || !items.length || !param) {
      return [];
    }

    return items.sort(function(a, b) {
      if (a[param] < b[param]) {
        return direct ? -1 : 1;
      }
      if (a[param] > b[param]) {
        return direct ? 1 : -1;
      }

      return 0;
    });
  }
};
