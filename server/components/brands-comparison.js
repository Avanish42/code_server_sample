var CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  var Brand = app.models.Brand,
      UserHistory = app.models.UserHistory;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    if (!(req.body.brands && req.body.brands.length > 1)) {
      var errors = [
        { errorCode: '000-002', errorMessage: 'Field required', errorField: 'brands' }
      ];

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    Brand.find({where: {id: {inq: req.body.brands}}}, function(err, brands) {
      if (err || !brands || req.body.brands.length !== brands.length) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Brand not found',
          errors: []
        });

        return;
      }


      UserHistory.findOne({where: {userId: req.accessToken.userId}}, function(err, history) {
        if (err || !history) {
          res.status(404);
          res.json({
            code: '000-404',
            message: 'UserHistory not found',
            errors: []
          });

          return;
        }

        var chbDays = app.get('comparisonHistoryBrands').keepDays,
            now = new Date().getTime(),
            newHistoryItem = {};

        newHistoryItem[now] = req.body.brands;
        !history.comparisonBrands && (history.comparisonBrands = []);
        if (history.comparisonBrands.length) {
          history.comparisonBrands = history.comparisonBrands.filter(function(brandItem) {
            var currentDate = Object.keys(brandItem)[0],
              dateAgo = chbDays * 24 * 60 * 60 * 1000;

            if (currentDate >= now - dateAgo) {
              return brandItem;
            }
          });
        }

        history.comparisonBrands.push(newHistoryItem);
        history.save(function(err) {
          if (CheckSave(err, res)) {
            res.json({
              code: 0,
              data: brands
            });
          }
        });
      });

    });
  });

};
