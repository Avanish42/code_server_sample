var Promise = require('promise'),
    CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var UserHistory = app.models.UserHistory,
      Brand = app.models.Brand;


  /*
  ////////// GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var reqParams = {where: {userId: req.accessToken.userId}};

    /*
    // GET LAST VIEWED BRAND LIST (ids)
    */
    var getLastViewedBrands = function(reqParams) {
      var promiseGetLastViewedBrands = new Promise(function(resolve, reject) {
        UserHistory.findOne(reqParams, function(err, userHistory) {
          if (err || !userHistory || !userHistory.lastViewedBrands.length) {
            reject(err || null, null);
            return;
          }

          resolve(userHistory.lastViewedBrands);
        });
      });

      promiseGetLastViewedBrands
        .then(fillingBrandsList)
        .catch(function(err) {
          res.json({
            code: 0,
            data: []
          });
        });
    };

    /*
    // FILLING
    */
    var fillingBrandsList = function(response) {
      var reqParams = {
            where: {id: {inq: response}},
            fields: ['id', 'title', 'subcategoryId', 'avgRate', 'image', 'reviews'],
            include: [
              {
                relation: 'subcategory',
                scope: {
                  fields: ['id', 'title']
                }
              },
              {
                relation: 'getReviews',
                scope: {
                  fields: ['id'],
                  where: {
                    text: {regexp: /./}
                  }
                }
              }
            ]
          },
          lastViewedBrands = response.map(function (item) { return String(item)});

      Brand.find(reqParams, function(err, brands) {
        var brandsList = [];

        brands && brands.forEach(function(brand) {
          var brandJSON = brand.toJSON();

          brandJSON.reviewsSum = brandJSON.reviews.length;
          brandJSON.reviewsWithTextSum = brandJSON.getReviews.length;
          brandJSON.reviewsRatedSum = brandJSON.reviews.length - brandJSON.getReviews.length;
          delete brandJSON.reviews;

          if (lastViewedBrands.indexOf(String(brandJSON.id)) > -1) {
            brandsList[lastViewedBrands.indexOf(String(brandJSON.id))] = brandJSON;
          } else {
            brandsList.push(brandJSON);
          }
        });

        res.json({
          code: 0,
          data: brandsList
        })
      });
    };

    /*
    // INIT
    */
    getLastViewedBrands(reqParams);
  });

};
