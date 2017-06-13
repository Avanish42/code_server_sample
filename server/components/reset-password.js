module.exports = function(app, options) {

  var User = app.models.UserModel,
      AccessTokenModel = app.models.AccessTokenModel;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    if (!req.body.password || req.body.password.length < app.get('validations').password.min) {
      res.status(400);
      res.json({
        code: '000-004',
        message: 'Password is too short',
        errors: []
      });

      return;
    }

    AccessTokenModel.findById(req.query.access_token, function(err, token) {
      if (err || !token) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Token not found',
          errors: []
        });

        return;
      }

      token.user(function(err, user) {
        if (err || !user) {
          res.status(404);
          res.json({
            code: '000-404',
            message: 'User not found',
            errors: []
          });

          return;
        }

        user.updateAttribute('password', req.body.password, function(err) {
          if (err) {
            res.status(500);
            res.json({
              code: '000-500',
              message: 'Password change is failed',
              errors: []
            });
          } else {
            token.destroy();
            res.json({
              code: 0,
              data: null
            });
          }
        });
      });
    });

  });

};
