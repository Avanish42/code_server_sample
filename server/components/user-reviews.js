var CheckToken = require('../modules/check-token'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function(app, options) {

  var Review = app.models.Review;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var limit = parseInt(req.query.pageSize) || 10,
        skip = (parseInt(req.query.page) - 1 || 0) * limit,
        reqParams = {
          where: {authorId: req.params.id},
          order: 'createdAt DESC',
          limit: limit,
          skip: skip,
          include: [
            {
              relation: 'brand',
              scope: {
                fields: ['id', 'title', 'image', 'subcategoryId', 'countries'],
                include: [
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

      Review.find(reqParams, function(err, reviews) {
        res.json({
          code: 0,
          data: reviews || []
        });
      });
    });

  });

};
