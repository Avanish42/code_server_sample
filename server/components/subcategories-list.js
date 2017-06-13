var CheckToken = require('../modules/check-token');

module.exports = function (app, options) {

  var Subcategory = app.models.Subcategory;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    Subcategory.find({}, function(err, subcategories) {
      var subcatFillCount = 0;

      if (!req.query.childrensSize) {
        res.json({
          code: 0,
          data: subcategories
        });
      } else {
        subcategories.forEach(function(subcategory) {
          subcategory.brand(function(err, brands) {
            if (!err && brands) {
              subcategory.childrens = brands.slice(0, req.query.childrensSize)
            }
            subcatFillCount++;

            if (subcatFillCount === subcategories.length) {
              res.json({
                code: 0,
                data: subcategories
              });
            }
          });
        });
      }

    });
  });

};
