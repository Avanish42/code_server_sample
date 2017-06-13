var CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

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

      res.json({
        code: 0,
        data: user.settings.notifications
      });
    });
  });


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var hasChanges = false;

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

      for (var pName in req.body) {
        if (req.body.hasOwnProperty(pName)) {
          if (Object.keys(user.settings.notifications).indexOf(pName) !== -1) {
            if (req.body[pName].hasOwnProperty('push')) {
              hasChanges = true;
              user.settings.notifications[pName].push = !!req.body[pName].push;
            }
            if (req.body[pName].hasOwnProperty('email')) {
              hasChanges = true;
              user.settings.notifications[pName].email = !!req.body[pName].email;
            }
          }
        }
      }

      if (hasChanges) {
        user.save(function(err) {
          if (CheckSave(err, res)) {
            res.json({
              code: 0,
              data: null
            });
          }
        })
      } else {
        res.json({
          code: 0,
          data: null
        });
      }
    });
  });

};
