module.exports = function(app, options) {

  var User = app.models.UserModel,
      AccessTokenModel = app.models.AccessTokenModel;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {

    User.findOne({where: {email: req.body.email}}, function(err, user) {
      if (err || !user) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'User not found',
          errors: []
        });

        return;
      }

      user.createAccessToken(1000 * 24 * 60 * 60, function(err, token) {
        if (err || !user) {
          res.status(500);
          res.json({
            code: '000-500',
            message: 'Create accessToken is failed',
            errors: []
          });

          return;
        }

        AccessTokenModel.destroyAll({userId: user.id, id: {neq: token.id}}, function(err, info) {
          User.emit('emailSend', {
            state: 'resetPasswordRequest',
            email: user.email,
            accessToken: token,
            user: user
          });

          res.json({
            code: 0,
            data: null
          });
        });
      });
    });

  });

};
