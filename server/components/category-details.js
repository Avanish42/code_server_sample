var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var Category = app.models.Category;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    Category.findById(req.params.id, function(err, category) {

      if (err || !category) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Category not found',
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

        category.iSubscriber = user.categories.indexOf(category.id + '') !== -1;

        res.json({
          code: 0,
          data: category
        });

      });
    });
  });

};
