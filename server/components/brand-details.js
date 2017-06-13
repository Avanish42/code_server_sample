var async = require('async'),
    CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function(app, options) {

  var Brand = app.models.Brand,
      UserHistory = app.models.UserHistory;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    async.waterfall([
      // INIT
      function(cb) {
        cb(null, {dependencies: {}});
      },
      // IDENTIFY USER
      function(waterfallObj, cb) {
        req.accessToken.user(function (err, user) {
          if (err || !user) {
            res.status(404);
            return cb({
              code: '000-404',
              message: 'User not found',
              errors: []
            });
          }

          waterfallObj.dependencies.user = user;
          cb(null, waterfallObj);
        });
      },
      // DETECT COUNTRY
      function(waterfallObj, cb) {
        CheckCountryOnBrands(waterfallObj.dependencies.user.address.countryCode, function(err, country) {
          waterfallObj.dependencies.country = country || null;
          cb(null, waterfallObj);
        });
      },
      // GET BRAND DATA || GET SUBCATEGORY DATA
      function(waterfallObj, cb) {
        var reqParams;

        reqParams = {
          where: {
            id: req.params.id,
            state: {
              inq: ['added_by_admin', 'accepted']
            },
            countries: waterfallObj.dependencies.country
          },
          include: [
            { relation: 'subcategory',
              scope: { fields: ['id', 'brands'] }
            },
            {
              relation: 'getReviews',
              scope: { fields: ['id'], where: { text: {regexp: /./}} }
            }
          ]
        };

        Brand.findOne(reqParams, function(err, brand) {
          if (err || !brand) {
            res.status(404);
            return cb({
              code: '000-404',
              message: 'Brand not found or is not available in your country',
              errors: []
            });
          }

          var brandJSON = brand.toJSON();

          brandJSON.reviewsSum = brand.reviews.length;
          brandJSON.reviewsWithTextSum = brandJSON.getReviews.length;
          brandJSON.reviewsRatedSum = brandJSON.reviews.length - brandJSON.getReviews.length;
          brandJSON.iSubscriber = waterfallObj.dependencies.user.brands.indexOf(String(brand.id)) !== -1;

          waterfallObj.dependencies.brand = brandJSON;
          waterfallObj.dependencies.subcategory = waterfallObj.dependencies.brand.subcategory;
          delete waterfallObj.dependencies.brand.subcategory;
          cb(null, waterfallObj);
        });
      },
      // GET CURRENT BRANDS ID`s
      function(waterfallObj, cb) {
        var reqParams;

        reqParams = {
          where: {
            subcategoryId: waterfallObj.dependencies.brand.subcategoryId,
            countries: waterfallObj.dependencies.country,
            state: {
              inq: ['added_by_admin', 'accepted']
            }
          },
          fields: ['id']
        };

        Brand.find(reqParams, function(error, brands) {
          waterfallObj.dependencies.brands = (brands || []).map(function(item) {
            return String(item.id);
          });

          setNearbyBrands({
            brand: waterfallObj.dependencies.brand,
            brands: waterfallObj.dependencies.brands
          });

          cb(null, waterfallObj);
        });
      },
      // UPDATE USER HISTORY
      function(waterfallObj, cb) {
        UserHistory.findOne({where: {userId: waterfallObj.dependencies.user.id}} ,function(err, history) {
          if (history) {
            var limit = app.get('lastViewedBrands').limit,
                brandId = String(waterfallObj.dependencies.brand.id);

            !history.lastViewedBrands && (history.lastViewedBrands = []);
            history.lastViewedBrands.length === limit && history.lastViewedBrands.splice(history.lastViewedBrands.length - 1, history.lastViewedBrands.length);

            if (history.lastViewedBrands.indexOf(brandId) !== -1) {
              history.lastViewedBrands = history.lastViewedBrands.filter(function(id) {
                return id !== brandId;
              });
            }

            history.lastViewedBrands.unshift(brandId);
            history.save(function(err) {
              cb(null, waterfallObj);
            });
          } else {
            cb(null, waterfallObj);
          }
        });
      }
    ], function(error, results) {
      if (error) {
        return res.json(error);
      }

      res.status(201);
      res.json({
        code: 0,
        data: results.dependencies.brand
      });
    });
  });

  // SUPPORT FNC`s
  function setNearbyBrands(params) {
    var brand = params.brand,
        brands = params.brands;

    brand.brandPrev = null;
    brand.brandNext = null;

    if (brands && brands.length > 1) {
      var positionCurrent = brands.indexOf(String(brand.id)),
          brandPrev = brands[positionCurrent - 1],
          brandNext = brands[positionCurrent + 1];

      if (0 !== positionCurrent && positionCurrent !== brands.length - 1) {
        brand.brandPrev = brandPrev;
        brand.brandNext = brandNext;
      } else if (positionCurrent === 0) {
        brand.brandNext = brandNext;
      } else if (positionCurrent === brands.length - 1) {
        brand.brandPrev = brandPrev;
      }
    }
  }
};
