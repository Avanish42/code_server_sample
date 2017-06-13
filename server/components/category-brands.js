var Promise = require('promise'),
    CheckToken = require('../modules/check-token'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function(app, options) {

  var Category = app.models.Category,
    Subcategory = app.models.Subcategory,
    Brand = app.models.Brand,
    User = app.models.UserModel;


  /*
  // GET
  */
  app.get(options.url, function (req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var userData,
        limit = parseInt(req.query.pageSize) || 10,
        skip = (parseInt(req.query.page) - 1 || 0) * limit,
        availableCountry;

    // GET USER PROFILE
    var promiseGetUser = new Promise(function(resolve, reject) {
      User.findOne({fields: ['address', 'subcategories', 'brands'], where: {id: req.accessToken.userId}}, function(err, user) {
        if (err || !user) {
          res.status(404);
          res.json({
            code: '000-404',
            message: 'User not found',
            errors: []
          });
        } else {
          userData = user;

          // --> Check country and findCategory
          CheckCountryOnBrands(user.address.countryCode, function(err, country) {
            availableCountry = country;
            resolve(country);
          });
        }
      });
    });

    // FIND CATEGORY
    var findCategory = function() {

      var promiseFindCategory = new Promise(function(resolve, reject) {
        Category.findById(req.params.id, function(err, category) {
          if (err || !category) {
            res.status(404);
            res.json({
              code: '000-404',
              message: 'Category not found',
              errors: []
            });
          } else {
            // --> findSubcategories
            resolve(category);
          }
        });
      });

      promiseFindCategory.then(findSubcategories);
    };

    // FIND SUBCATEGORIES
    var findSubcategories = function(category) {
      var promiseFindSubcategories = new Promise(function(resolve, reject) {
        var reqParams = {
          limit: limit,
          skip: skip,
          where: {id: {inq: category.subcategories}},
          fields: ['id', 'title', 'image', 'brands']
        };

        Subcategory.find(reqParams, function(err, subcategories) {
          if (err || !subcategories || !subcategories.length) {
            res.json({
              code: 0,
              data: subcategories
            });
          } else {
            // --> prepareSubcategories
            resolve(subcategories);
          }
        });
      });

      promiseFindSubcategories.then(prepareSubcategories);
    };

    // PREPARE SUBCATEGORIES
    var prepareSubcategories = function(subcategories) {
      var subcategoriesObj = [];

      subcategories.forEach(function(subcategory) {
        var subcategoryJSON = subcategory.toJSON();
        subcategoryJSON.brands = [];
        subcategoryJSON.iSubscriber = userData.subcategories.indexOf(subcategoryJSON.id + '') !== -1;
        subcategoriesObj[subcategoryJSON.id] = subcategoryJSON;
      });

      fillBrandsIntoSubcategories(subcategoriesObj);
    };

    // FILL BRANDS INTO SUBCATEGORY
    var fillBrandsIntoSubcategories = function(subcategoriesObj) {
      var reqParams = {
            where: {
              subcategoryId: {inq: Object.keys(subcategoriesObj)},
              state: { inq: ['accepted', 'added_by_admin'] },
              countries: availableCountry
            },
            fields: ['id', 'title', 'image', 'subcategoryId']
          };

      Brand.find(reqParams, function(err, brands) {
        var brandsMax = req.query.brandsOnStack ? Number(req.query.brandsOnStack) : brands.length,
            subcategories = [],
            brandsBySubcategoriesObj = {};

        brands.forEach(function(brand) {
          var subcategoryId = String(brand.subcategoryId);

          !brandsBySubcategoriesObj[subcategoryId] && (brandsBySubcategoriesObj[subcategoryId] = []);
          brandsBySubcategoriesObj[subcategoryId].push(brand);
        });

        // check and exit
        if (err || !brands || !brands.length) {
          res.json({
            code: 0,
            data: subcategories
          });

          return;
        }

        Object.keys(subcategoriesObj).forEach(function(subcategoryId) {
          brandsBySubcategoriesObj[subcategoryId] && brandsBySubcategoriesObj[subcategoryId].forEach(function (brand, index) {
            var brandJSON = brand.toJSON();

            if (subcategoriesObj[brandJSON.subcategoryId].brands.length < brandsMax) {
                brandJSON.iSubscriber = userData.brands.indexOf(String(brandJSON.id)) !== -1;
                subcategoriesObj[brandJSON.subcategoryId].brands.push(brandJSON);
            }
          });
        });

        for (var pName in subcategoriesObj) {
          if (subcategoriesObj.hasOwnProperty(pName)) {
            subcategories.push(subcategoriesObj[pName]);
          }
        }

        res.json({
          code: 0,
          data: subcategories
        });
      });
    };

    // INIT
    promiseGetUser.then(findCategory);
    //
  });

};
