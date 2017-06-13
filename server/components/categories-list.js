var CheckToken = require('../modules/check-token');

module.exports = function (app, options) {

  var Category = app.models.Category;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    // Get current user
    req.accessToken.user(function(err, user) {
      // Find categories
      Category.find({}, function(err, categories) {
        var catFillCount = 0;

        if (!req.query.childrensSize) {
          categories && categories.forEach(function(category) {
            category.iSubscriber = user.categories.indexOf(category.id + '') !== -1;
          });
          //

          res.json({
            code: 0,
            data: categories
          });
        } else {
          categories.forEach(function(category) {
            category.iSubscriber = user.categories.indexOf(category.id + '') !== -1;
            category.subcategory(function(err, subcategories) {
              if (!err && subcategories && subcategories.length) {
                category.childrens = subcategories.slice(0, req.query.childrensSize)
              }
              catFillCount++;

              if (catFillCount === categories.length) {
                res.json({
                  code: 0,
                  data: categories
                });
              }
            });
          });
        }
      });
      //
    });
    //
  });

};
