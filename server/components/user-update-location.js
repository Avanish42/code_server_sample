var CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  /*
  // POST
  */
  app.post(options.url, function(req, res) {
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

      if (!req.body.lat || !req.body.lng || !req.body.country || !req.body.city) {
        var errors = [];

        if (!req.body.country) {
          errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'country' });
        }
        if (!req.body.city) {
          errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'city' });
        }
        if (!req.body.lat) {
          errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'lat' });
        }
        if (!req.body.lng) {
          errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'lng' });
        }

        if (errors.length) {
          res.status(400);
          res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

          return;
        }
      }

      // SET LOCATION
      for (var pName in req.body.location) {
        if (typeof req.body.location[pName] === 'string') {
          req.body.location[pName] = pName !== 'countryCode' ? req.body.location[pName].toLowerCase() : req.body.location[pName];
        }
      }

      user.address = { country: req.body.country, city: req.body.city, countryCode: req.body.countryCode || null };
      user.settings.devices[req.headers['x-device-id'] || user.meta.deviceId || 0] = {
        address: user.address,
        location: new app.loopback.GeoPoint({lat: req.body.lat, lng: req.body.lng})
      };

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
