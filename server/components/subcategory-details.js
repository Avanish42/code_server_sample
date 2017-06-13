var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var Subcategory = app.models.Subcategory;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    Subcategory.findById(req.params.id, function(err, subcategory) {

      if (err || !subcategory) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Subcategory not found',
          errors: []
        });

        return;
      }

      req.accessToken.user(function(err, user) {

        if (err || !user) {
          res.status(404);
          res.json({
            code: '000-404',
            message: 'User not found',
            errors: []
          });

          return;
        }

        subcategory.iSubscriber = user.subcategories.indexOf(subcategory.id + '') !== -1;

        res.json({
          code: 0,
          data: subcategory
        });

      });
    });
  });

};
