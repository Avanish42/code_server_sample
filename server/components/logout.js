var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var User = app.models.UserModel,
      AccessToken = app.models.AccessTokenModel;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var userId = req.accessToken.userId;

    User.logout(req.accessToken.id, function(err) {
      if (err) {
        res.status(500);
        res.json({
          code: '000-500',
          message: err.message,
          errors: []
        });

        return;
      }

      AccessToken.destroyAll({userId: userId || 'ghost'});
      res.json({
        code: 0,
        data: null
      });
    });

  });

};
