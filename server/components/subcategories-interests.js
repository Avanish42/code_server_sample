var CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  var Brand = app.models.Brand;


  /*
  // PUT
  */
  app.put(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;
    var paramSubcategories = req.body.subcategories;

    if (!paramSubcategories) {
      var errors = [
        { errorCode: '000-002', errorMessage: 'Field required', errorField: 'subcategories' }
      ];

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    req.accessToken.user(function(err, user) {
      paramSubcategories.forEach(function(subcategoryId) {
        if (user.subcategories.indexOf(String(subcategoryId)) === -1) {
          user.subcategories.push(subcategoryId);
        }
      });

      subscribeToBrands(user);
    });

    /*
    // SUBSCRIBE TO BRANDS
    */
    var subscribeToBrands = function(user) {
      var promiseSubscribeToBrands = new Promise(function(resolve, reject) {
        Brand.find({where: {subcategoryId: {inq: user.subcategories}}}, function(err, brands) {
          if (err) {
            reject(err);
          } else if (!brands || !brands.length) {
            reject(null);
          }

          var brandsIds = brands.map(function(brand) {
            return String(brand.id);
          });

          brandsIds.forEach(function(brandId) {
            if (user.brands.indexOf(String(brandId)) === -1) {
              user.brands.push(brandId);
            }
          });

          resolve();
        });
      });

      promiseSubscribeToBrands
        .then(function(response) {
          user.updateAttributes({subcategories: user.subcategories, brands: user.brands}, function(err, instance) {
            if (CheckSave(err, res)) {
              res.json({
                code: 0,
                data: []
              });
            }
          });
        })
        .catch(function() {
          if (!err) {
            user.updateAttributes({subcategories: user.subcategories, brands: user.brands}, function(err, instance) {
              if (CheckSave(err, res)) {
                res.json({
                  code: 0,
                  data: []
                });
              }
            });
            return;
          }

          res.status(400);
          res.json({ code: '000-500', message: 'Process subscribe to brands was failed', errors: [] });
        });
    }

  });


  /*
  // DELETE
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;
    var paramSubcategories = req.body.subcategories;

    if (!paramSubcategories) {
      var errors = [
        { errorCode: '000-002', errorMessage: 'Field required', errorField: 'subcategories' }
      ];

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    req.accessToken.user(function(err, user) {
      user.subcategories = user.subcategories.filter(function(subcategoryId) {
        return paramSubcategories.indexOf(String(subcategoryId)) === -1;
      });

      unsubscribeFromBrands(user, paramSubcategories);
    });

    /*
    // UNSUBSCRIBE FROM BRANDS
    */
    var unsubscribeFromBrands = function(user, subcategoriesIds) {
      var promiseUnsubscribeFromBrands = new Promise(function(resolve, reject) {
        Brand.find({where: {subcategoryId: {inq: subcategoriesIds}}}, function(err, brands) {
          if (err) {
            reject(err);
          } else if (!brands || !brands.length) {
            reject(null);
          }

          var brandsIds = brands.map(function(brand) {
            return String(brand.id);
          });

          user.brands = user.brands.filter(function(brandId) {
            return brandsIds.indexOf(String(brandId)) === -1;
          });

          resolve(true);
        });
      });

      promiseUnsubscribeFromBrands
        .then(function(response) {
          user.updateAttributes({subcategories: user.subcategories, brands: user.brands}, function(err, instance) {
            if (CheckSave(err, res)) {
              res.json({
                code: 0,
                data: []
              });
            }
          });
        })
        .catch(function(err) {
          if (!err) {
            user.updateAttributes({subcategories: user.subcategories, brands: user.brands}, function(err, instance) {
              if (CheckSave(err, res)) {
                res.json({
                  code: 0,
                  data: []
                });
              }
            });
            return;
          }

          res.status(400);
          res.json({ code: '000-500', message: 'Process subscribe to brands was failed', errors: [] });
        });
    }

  });

};
