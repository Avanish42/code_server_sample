var filterParser = require('../modules/filter-parser'),
    CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save'),
    AchievementsManager = require('../modules/achievements-manager'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function(app, options) {

  var Subcategory = app.models.Subcategory,
      Brand = app.models.Brand;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);

    if (!isValidToken) return;

    var limit = parseInt(req.query.pageSize) || 10,
        skip = (parseInt(req.query.page) - 1 || 0) * limit,
        reqParams = {
          limit: limit,
          skip: skip,
          include: [
            {
              relation: 'category',
              scope: {
                fields: ['title', 'image']
              }
            },
            {
              relation: 'subcategory',
              scope: {
                fields: ['title']
              }
            }
          ],
          where: {}
        };

    if (req.query.filter) {
      reqParams.where = filterParser(req.query.filter);
    }

    if (req.query.query) {
      reqParams.where.title = {regexp: req.query.query + '/i'};
    }

    reqParams.where.state = { inq: ['accepted', 'added_by_admin'] };

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
        reqParams.where.countries = country;

        // USE SUGGESTED
        if (reqParams.where.suggested) {
          if (country.indexOf('#') === -1) {
            delete reqParams.where.suggested;
            reqParams.where['suggested.' + country] = true;
          }
        }

        Brand.find(reqParams, function (err, brands) {
          var brandsList = [];

          brands && brands.forEach(function(brand) {
            var brandJSON = brand.toJSON();

            brandJSON.reviewsSum = brandJSON.reviews.length;
            brandJSON.iSubscriber = user.brands && user.brands.indexOf(brand.id) !== -1;

            brandsList.push(brandJSON);
          });

          res.json({
            code: 0,
            data: brandsList
          });
        });
      });
    });
  });


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var errors;
    if (!req.body.subcategoryId || !req.body.title || !req.body.text) {
      errors = [];

      if (!req.body.subcategoryId) {
        errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'subcategoryId' });
      }
      if (!req.body.title) {
        errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'title' });
      }
      if (!req.body.text) {
        errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'text' });
      }

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    var newBrand = {
          authorId: req.accessToken.userId,
          subcategoryId: req.body.subcategoryId,
          title: req.body.title,
          text: req.body.text,
          image: req.body.image ? req.body.image.replace(app.get('basePath'), '/') : null,
          state: 'new',
          avgRate: 0,
          reviews: [],
          createDate: new Date().getTime(),
          createUserId: req.accessToken.userId
        };

    Subcategory.findById(newBrand.subcategoryId, function(err, subcategory) {
      if (err || !subcategory) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Subcategory not found',
          errors: []
        });

        return;
      }

      newBrand.categoryId = subcategory.parentId;

      Brand.create(newBrand, function(err, brand) {
        if (CheckSave(err, res)) {
          !subcategory.brands && (subcategory.brands = []);
          subcategory.brands.push(String(brand.id));

          subcategory.save(function(err, subcat) {
            if (CheckSave(err, res)) {
              var setAchievementPromise = new Promise(function(resolve, reject) {
                req.accessToken.user(function(err, user) {
                  if (user) {
                    AchievementsManager({
                      type: 'add_brand',
                      user: user,
                      resolve: resolve
                    });
                  }

                  res.json({
                    code: 0,
                    data: {
                      id: brand.id
                    }
                  });
                });
              });
            }
          });
        }
      });
    });

  });

};
