var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var Brand = app.models.Brand,
      UserHistory = app.models.UserHistory;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    UserHistory.findOne({where: {userId: req.accessToken.userId}}, function(err, history) {
      if (err || !history) {
        res.json({
          code: 0,
          data: []
        });

        return;
      }

      // Echo Skip History
      var limit = parseInt(req.query.pageSize) || 10,
          skip = (parseInt(req.query.page) - 1 || 0) * limit,
          brandsIds4Load = [],
          brands4Print = [];

      history.comparisonBrands.forEach(function(cbItem) {
        brandsIds4Load = brandsIds4Load.concat(cbItem[Object.keys(cbItem)[0]]);
      });

      Brand.find({where: {id: {inq: brandsIds4Load}}}, function(err, brands) {
        if (err || !brands || !brands.length) {
          res.json({
            code: 0,
            data: brands
          });

          return;
        }

        brands.forEach(function(brand) {

          history.comparisonBrands.forEach(function(cbItem) {
            var xIndex = cbItem[Object.keys(cbItem)[0]].indexOf(brand.id);
            if (xIndex !== -1) {
              cbItem[Object.keys(cbItem)[0]][xIndex] = brand;
            }
          });

        });

        // Echo Skip Brands
        for (var i = skip; i <= skip + limit; i++) {
          if (!history.comparisonBrands[i] || i > skip + limit - 1) {
            res.json({
              code: 0,
              data: brands4Print
            });
            return;
          } else {
            brands4Print.push(history.comparisonBrands[i]);
          }
        }

        res.json({
          code: 0,
          data: brands4Print
        });
      });

    });
  });

};
