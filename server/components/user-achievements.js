var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var User = app.models.UserModel,
      Achievement = app.models.Achievement;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var limit = parseInt(req.query.pageSize) || 10,
        skip = (parseInt(req.query.page) - 1 || 0) * limit,
        reqParams = {
          where: req.params
        };

    User.findOne(reqParams, function(err, user) {
      if (err || !user) {
        res.status(404);
        res.json({
          code: '000-404',
          message: err && err.message ? err.message : 'User not found',
          errors: []
        });

        return;
      }

      Achievement.find({where: {id: {inq: user.achievements}}}, function(err, achievs) {
        var achievs4Print = [];

        if (err || !achievs) {
          res.status(404);
          res.json({
            code: '000-404',
            message: err && err.message ? err.message : 'Achievements not found',
            errors: []
          });

          return;
        }

        // Echo Skip Achievements
        for (var i = skip; i <= skip + limit; i++) {
          if (!achievs[i] || i > skip + limit - 1) {
            res.json({
              code: 0,
              data: achievs4Print
            });
            return;
          } else {
            achievs4Print.push(achievs[i]);
          }
        }

        res.json({
          code: 0,
          data: achievs4Print
        })
      });

    });

  });

};
