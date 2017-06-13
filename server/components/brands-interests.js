var CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  /*
  // PUT
  */
  app.put(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;
    var paramBrands = req.body.brands;

    if (!paramBrands) {
      var errors = [
        { errorCode: '000-002', errorMessage: 'Field required', errorField: 'brands' }
      ];

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    req.accessToken.user(function(err, user) {
      paramBrands.forEach(function(brandId) {
        if (user.brands.indexOf(String(brandId)) === -1) {
          user.brands.push(brandId);
        }
      });

      user.updateAttributes({brands: user.brands}, function(err) {
        if (CheckSave(err, res)) {
          res.json({
            code: 0,
            data: null
          });
        }
      });
    });

  });


  /*
  // DELETE
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;
    var paramBrands = req.body.brands;

    if (!paramBrands) {
      var errors = [
        { errorCode: '000-002', errorMessage: 'Field required', errorField: 'brands' }
      ];

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    req.accessToken.user(function(err, user) {
      user.brands = user.brands.filter(function(brandId) {
        return paramBrands.indexOf(String(brandId)) === -1;
      });

      user.save(function(err) {
        if (CheckSave(err, res)) {
          res.json({
            code: 0,
            data: null
          });
        }
      });
    });

  });

};
