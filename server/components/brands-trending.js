var filterParser = require('../modules/filter-parser'),
    CheckToken = require('../modules/check-token'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function (app, options) {

  var Brand = app.models.Brand;


  /*
  // GET
  */
  app.get(options.url, function (req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

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

        var limit = parseInt(req.query.pageSize) || app.get('trendingRate').maxBrands,
          skip = (parseInt(req.query.page) - 1 || 0) * limit,
          reqParams = {
            where: {},
            limit: limit,
            skip: skip,
            fields: ['id', 'title', 'image', 'avgRate', 'reviews', 'trending'],
            order: 'trending.index ASC',
            include: {
              relation: 'getReviews',
              scope: {
                fields: ['id'],
                where: {
                  text: {regexp: /./}
                }
              }
            }
          };

        if (req.query.filter) {
          reqParams.where = filterParser(req.query.filter);
        }

        if (req.query.query) {
          reqParams.where.title = {regexp: req.query.query + '/i'};
        }

        reqParams.where['trending.date'] = {gt: 1};
        reqParams.where.state = { inq: ['accepted', 'added_by_admin'] };
        reqParams.where.countries = country;

        Brand.find(reqParams, function(err, brands) {
          if (err || !brands || !brands.length) {
            res.json({
              code: 0,
              data: []
            });

            return;
          }

          brands.forEach(function(brand) {
            brand.reviewsSum = brand.reviews.length;
            brand.reviewsWithTextSum = brand.getReviews.length;
            brand.reviewsRatedSum = brand.reviews.length - brand.getReviews.length;
          });

          res.json({
            code: 0,
            data: brands
          });
        });
      });
    });

  });

};
