var filterParser = require('../modules/filter-parser'),
    CheckToken = require('../modules/check-token'),
    helper = require('../modules/helper'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function(app, options) {

  var Review = app.models.Review;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
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

      // GET AVAILABLE COUNTRY*
      CheckCountryOnBrands(user.address.countryCode, function(err, country) {

        //
        var reqParams = {
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
          ],
          where: {}
        };

        if (req.query.filter) { reqParams.where = filterParser(req.query.filter); }
        //reqParams.where.authorId = {neq: user.id};
        reqParams.where.or = [{authorId: {inq: user.following}}, {brandId: {inq: user.brands}}];

        if (req.query.withText) {
          reqParams.where.text = {regexp: /./};
        }

        //
        Review.find(reqParams, function(err, reviews) {
          var limit = parseInt(req.query.pageSize) || 10,
              skip = (parseInt(req.query.page) - 1 || 0) * limit,
              brands = [],
              brandsIds = [],
              reviewsFormatted = [],
              reviews4Print = [];

          if (err || !reviews.length) {
            res.json({
              code: 0,
              data: reviewsFormatted
            });

            return;
          }

          // SORT BY FOLLOWING
          reviews = sortBy(reviews, user.following);

          reviews.forEach(function(review) {
            var r = review.toJSON(),
                brand = r.brand;

            if (!brand) {
              return;
            }

            var brandIndex = brandsIds.indexOf(brand.id),
                available = brand.countries.indexOf(country) !== -1;

            brand.reviewsSum = brand.reviews.length;
            brand.reviewsWithTextSum = brand.getReviews.length;
            brand.reviewsRatedSum = brand.reviews.length - brand.getReviews.length;

            if (brandIndex === -1 && (brand.state === 'accepted' || 'added_by_admin' === brand.state) && available) {
              brand.reviews = [];
              brandsIds.push(brand.id);
              brands.push(brand);
              reviewsFormatted.push(brand);
            } else if (brandIndex !== -1) {
              brand = brands[brandIndex];
            }

            if (app.get('feedsFollower').maxInStack >= brand.reviews.length) {
              var review4Print = helper.mask(r, 'id,authorId,brandId,text,rate,images,comments,likes,createdAt,modifiedAt');
              review4Print.location = {
                country: review.address.country,
                city:    review.address.city,
                lat:     review.location.lat,
                lng:     review.location.lng
              };

              if (r.user) {
                review4Print.user = helper.mask(r.user, 'id,username,email,firstName,lastName,dob,gender,photo');
              }

              brand.reviews.push(review4Print);
            }
          });

          // Echo Skip Reviews
          for (var i = skip; i <= skip + limit; i++) {
            if (!reviewsFormatted[i] || i > skip + limit - 1) {
              res.json({
                code: 0,
                data: reviews4Print
              });
              return;
            } else {
              reviews4Print.push(reviewsFormatted[i]);
            }
          }

          res.json({
            code: 0,
            data: reviews4Print
          });
        });
      });

    });
  });


  /*
  // Support FNCs
  */
  var sortBy = function (items, by) {
    if (!items || !by || !by.length) {
      return items;
    }

    var A = items,
        n = items.length;

    for (var u = 0; u < by.length; u++) {
      for (var i = 0; i < n-1; i++) {
        for (var j = 0; j < n-1-i; j++) {
          var x = A[j+1],
              y = A[j];

          if (y.authorId && y.authorId !== by[u] && by[u] === x.authorId) {
            var t = A[j+1];
            A[j+1] = A[j];
            A[j] = t;
          }
        }
      }
    }

    return items;
  };

};
