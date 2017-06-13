var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var Brand = app.models.Brand;


  /*
   // GET
   */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var reqParams = {
      where: req.params,
      include: [
        {
          relation: 'getReviews',
          scope: {
            fields: ['id', 'rate', 'text', 'comments', 'images']
          }
        }
      ]
    };

    Brand.findOne(reqParams, function (err, brand) {
      if (err || !brand) {
        return res.json({
          code: 0,
          data: null
        });
      }

      var brandJSON = brand.toJSON(),
          stats = {
            avgRate: brandJSON.avgRate,
            avgRateSum: brandJSON.avgRateSum,
            reviewsSum: brandJSON.reviews.length,
            reviewsWithTextSum: 0,
            reviewsRatedSum: 0,
            reviewsImageSum: 0,
            reviewsWithCommentsSum: 0,
            rates: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0
            }
          };

      brandJSON.getReviews.forEach(function (item) {
        if (item.text && item.text.length) {
          stats.reviewsWithTextSum++;
        }
        if (item.comments && item.comments.length) {
          stats.reviewsWithCommentsSum++;
        }
        if (item.images) {
          stats.reviewsImageSum += item.images.length;
        }
        if (item.rate) {
          stats.rates[item.rate]++;
        }
      });

      //
      stats.reviewsRatedSum = brandJSON.reviews.length - stats.reviewsWithTextSum;

      res.json({
        code: 0,
        data: stats
      });
    });
  });

};
