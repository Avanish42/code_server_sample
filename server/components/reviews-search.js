var filterParser = require('../modules/filter-parser'),
    CheckToken = require('../modules/check-token'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function(app, options) {

  var Review = app.models.Review;


  /*
  // GET
  */
  app.get(options.url, function (req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var limit = parseInt(req.query.pageSize) || 10,
        skip = (parseInt(req.query.page) - 1 || 0) * limit,
        reqParams = {
          where: {},
          limit: limit,
          skip: skip,
          include: [
            {
              relation: 'brand',
              scope: {
                fields: ['id', 'title', 'image', 'avgRate', 'countries']
              }
            },
            {
              relation: 'user',
              scope: {
                fields: ['id', 'username', 'photo']
              }
            }
          ]
        };

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

      //
      if (req.query.filter) {
        reqParams.where = filterParser(req.query.filter);
        reqParams.where.hashtags && (reqParams.where.hashtags = new RegExp(reqParams.where.hashtags, 'i'));
      }

      if (req.query && req.query.query) {
        var pattern =  new RegExp(req.query.query, 'i');
        reqParams.where = {hashtags: pattern};
      } else {
        return res.json({
          code: 0,
          data: null
        });
      }

      Review.find(reqParams, function(err, reviews) {
        if (err || !reviews || !reviews.length) {
          res.json({
            code: 0,
            data: []
          });

          return;
        }

        var reviewsList = [];
        CheckCountryOnBrands(user.address.countryCode, function(err, country) {
          reviews.forEach(function(review) {
            var reviewJSON = review.toJSON();

            if (reviewJSON.brand && reviewJSON.brand.countries.indexOf(country) !== -1) {
              reviewsList.push(reviewJSON);
            }
          });

          res.json({
            code: 0,
            data: reviewsList
          });
        });

      });
      //
    });
  });
};
