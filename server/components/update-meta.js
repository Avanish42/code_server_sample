var CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  /*
  // PUT
  */
  app.put(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    if (!(req.body.meta && req.body.meta.versionApp && req.body.meta.pushDeviceId)) {
      var errors = [];

      if (!req.body.meta) {
        errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'meta' });
      } else {
        if (!req.body.meta.versionApp) {
          errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'meta.versionApp' });
        }
        if (!req.body.meta.pushDeviceId) {
          errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'meta.pushDeviceId' });
        }
      }

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    req.accessToken.user(function(err, user) {
      !user.meta && (user.meta = {});
      user.meta.versionApp = req.body.meta.versionApp;
      user.meta.pushDeviceId = req.body.meta.pushDeviceId;
      user.meta.deviveId = req.body.meta.deviveId;
      user.save(function(err) {
        if (CheckSave(err, res)) {
          res.json({
            code: 0,
            data: null
          });
        }
      });
    });

  });

};
