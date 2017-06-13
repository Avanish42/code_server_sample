var filterParser = require('../modules/filter-parser'),
    CheckToken = require('../modules/check-token'),
    helper = require('../modules/helper'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function(app, options) {

  var Review = app.models.Review;


  /*
   // GET
   */
  app.get(options.url, function (req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    //
    var reqParams = {
      where: {},
      order: 'createdAt ASC',
      include: [
        {
          relation: 'user',
          scope: {
            fields: ['id', 'username', 'firstName', 'lastName', 'photo', 'reviews', 'followers']
          }
        },
        {
          relation: 'brand',
          scope: {
            fields: ['id', 'title', 'countries']
          }
        }
      ]
    };

    if (req.query.filter) {
      reqParams.where = filterParser(req.query.filter);

      if (reqParams.where['trending.index']) {
        reqParams.order = 'trending.index ASC';
      }
    }

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

        //
        Review.find(reqParams, function (err, reviews) {
          if (reqParams.where['trending.index'] && reviews && reviews.length) {
            reviews = reviews.map(function (review) {
              var reviewJSON = review.toJSON();

              if (reviewJSON.user) {
                reviewJSON.user.reviewsSum = reviewJSON.user.reviews.length;
                reviewJSON.user.followersSum = reviewJSON.user.followers.length;
                delete reviewJSON.user.reviews;
                delete reviewJSON.user.followers;
              }

              reviewJSON.commentsSum = reviewJSON.comments.length;
              reviewJSON.likesSum = reviewJSON.likes.length;

              return reviewJSON;
            });
          }

          // CHECK PARENT BRAND COUNTRIES
          var filteredReviews = [];

          reviews.forEach(function(review) {
            var available = review.toJSON().brand ? review.toJSON().brand.countries.indexOf(country) !== -1 : false;

            if (available) {
              filteredReviews.push(review);
            }
          });

          res.json({
            code: 0,
            data: filteredReviews
          });
        });
      });
    });
  });

};
