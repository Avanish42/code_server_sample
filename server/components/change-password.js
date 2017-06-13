var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    req.accessToken.user(function (err, user) {
      if (err || !user) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'User not found',
          errors: []
        });

        return;
      }

      //
      if (!req.body.oldPassword || !req.body.newPassword) {
        res.status(400);
        res.json({
          code: '000-001',
          message: 'Passwords is empty or not equals',
          errors: []
        });

        return;
      }

      //
      if (req.body.oldPassword === req.body.newPassword) {
        res.status(400);
        res.json({
          code: '000-001',
          message: 'Old password and new password is equals',
          errors: []
        });

        return;
      }

      //
      if (user.username && req.body.newPassword === user.username) {
        res.status(400);
        res.json({
          code: '001-001',
          message: 'Username and password should not be the same',
          errors: []
        });

        return;
      }

      //
      if (req.body.newPassword.length < app.get('validations').password.min) {
        res.status(400);
        res.json({
          code: '000-004',
          message: 'Password is too short',
          errors: []
        });

        return;
      }
      //

      user.hasPassword(req.body.oldPassword, function(err, compareResult) {
        if (err || !compareResult) {
          res.status(400);
          res.json({
            code: '000-500',
            message: 'Incorrect password',
            errors: []
          });

          return;
        }

        user.password = req.body.newPassword;
        user.save(function(err, instance) {
          if (err) {
            res.status(500);
            res.json({
              code: '000-500',
              message: 'Password change is failed',
              errors: []
            });

            return;
          }

          res.json({
            code: 0,
            data: null
          })
        });
      });
    });

  });

};
