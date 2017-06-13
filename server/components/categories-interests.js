var Promise = require('promise'),
    CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  var Category = app.models.Category,
      Brand = app.models.Brand;


  /*
  // PUT
  */
  app.put(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;
    var paramCategories = req.body.categories;

    if (!paramCategories) {
      var errors = [
        { errorCode: '000-002', errorMessage: 'Field required', errorField: 'categories' }
      ];

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    req.accessToken.user(function(err, user) {
      var newCategories = [],
          hasChanges = false;

      paramCategories.forEach(function(categoryId) {
        if (user.categories.indexOf(String(categoryId)) === -1) {
          hasChanges = true;
          newCategories.push(categoryId);
          user.categories.push(categoryId);
        }
      });

      if (hasChanges) {
        subscribeToSubcategories(user, newCategories);
      } else {
        res.json({
          code: 0,
          data: []
        })
      }
    });

    /*
    // SUBSCRIBE TO SUBCATEGORIES
    */
    var subscribeToSubcategories = function(user, categoriesIds) {
      var promiseSubscribeToSubcategories = new Promise(function(resolve, reject) {
        Category.find({where: {id: {inq: categoriesIds}}}, function(err, categories) {
          if (err || !categories || !categories.length) {
            reject(err);
            return;
          }

          var subcategoriesIds = [];
          categories.forEach(function(category) {
            subcategoriesIds = subcategoriesIds.concat(category.subcategories);
          });

          subcategoriesIds.forEach(function(subcategoryId) {
            if (user.subcategories.indexOf(String(subcategoryId)) === -1) {
              user.subcategories.push(subcategoryId);
            }
          });

          resolve(subcategoriesIds);
        });
      });

      promiseSubscribeToSubcategories
        .then(function(response) {
          subscribeToBrands(user);
        })
        .catch(function(err) {
          res.status(400);
          res.json({ code: '000-500', message: 'Process subscribe to subcategories was failed', errors: [] });
        });
    };

    /*
    // SUBSCRIBE TO BRANDS
    */
    var subscribeToBrands = function(user) {
      var promiseSubscribeToBrands = new Promise(function(resolve, reject) {
        Brand.find({where: {categoryId: {inq: user.categories}}}, function(err, brands) {
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
          user.updateAttributes({categories: user.categories, subcategories: user.subcategories, brands: user.brands}, function(err, instance) {
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
            user.updateAttributes({categories: user.categories, subcategories: user.subcategories, brands: user.brands}, function(err, instance) {
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
    var paramCategories = req.body.categories;

    if (!paramCategories) {
      var errors = [
        { errorCode: '000-002', errorMessage: 'Field required', errorField: 'categories' }
      ];

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    req.accessToken.user(function(err, user) {
      var deleteCategories = [];

      user.categories = user.categories.filter(function(categoryId) {
        if (paramCategories.indexOf(String(categoryId)) === -1) {
          return true;
        } else {
          deleteCategories.push(categoryId);
        }
      });

      unsubscribeFromSubcategories(user, deleteCategories);
    });

    /*
    // UNSUBSCRIBE FROM SUBCATEGORIES
    */
    var unsubscribeFromSubcategories = function(user, categoriesIds) {
      var promiseUnsubscribeFromSubcategories = new Promise(function (resolve, reject) {
        Category.find({where: {id: {inq: categoriesIds}}}, function(err, categories) {
          if (err) {
            reject(err);
            return;
          } else if (!categories || !categories.length) {
            reject(null);
          }

          var subcategoriesIds = [];
          categories.forEach(function(category) {
            subcategoriesIds = subcategoriesIds.concat(category.subcategories)
          });

          user.subcategories = user.subcategories.filter(function(subcategoryId) {
            return subcategoriesIds.indexOf(String(subcategoryId)) === -1;
          });

          resolve({
            user: user,
            categoriesIds: categoriesIds,
            subcategoriesIds: subcategoriesIds
          });
        });
      });

      promiseUnsubscribeFromSubcategories
        .then(function(response) {
          unsubscribeFromBrands(user, categoriesIds);
        })
        .catch(function(err) {
          if (!err) {
            res.json({
              code: 0,
              data: []
            });
            return;
          }

          res.status(400);
          res.json({ code: '000-500', message: 'Process unsubscribe from subcategories was failed', errors: [] });
        });
    };

    /*
    // UNSUBSCRIBE FROM BRANDS
    */
    var unsubscribeFromBrands = function(user, categoriesIds) {
      var promiseUnsubscribeFromBrands = new Promise(function(resolve, reject) {
        Brand.find({where: {categoryId: {inq: categoriesIds}}}, function(err, brands) {
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
          user.updateAttributes({categories: user.categories, subcategories: user.subcategories, brands: user.brands}, function(err, instance) {
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
            user.updateAttributes({categories: user.categories, subcategories: user.subcategories, brands: user.brands}, function(err, instance) {
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
