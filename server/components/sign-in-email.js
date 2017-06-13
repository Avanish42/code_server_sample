var Promise = require('promise'),
    CheckSave = require('../modules/check-save'),
    AchievementsManager = require('../modules/achievements-manager');

module.exports = function(app, options) {

  var User = app.models.UserModel;


  /*
  // POST
  */
  app.post(options.url, function (req, res) {
    var errors;

    User.login(req.body, function (err, token) {

      if (!err && token) {
        User.findById(token.userId, function(err, user) {

          if (!user.status) {
            res.status(400);
            res.json({
              code: '001-004',
              message: 'Your account has been deactivated',
              errors: []
            });

            return;
          }

          if (!err && user) {
            if (!(req.body.meta && req.body.meta.deviceId && req.body.meta.versionApp)) {
              errors = [];

              if (!req.body.meta) {
                errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'meta' });
              } else {
                if (!req.body.meta.deviceId) {
                  errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'meta.deviceId' });
                }
                if (!req.body.meta.versionApp) {
                  errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'meta.versionApp' });
                }
              }

              res.status(400);
              res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

              return;
            }

            // FIRST SESSION
            if (user.status === 2) {
              user.status = 1;
            }

            // Update USER data
            user.meta = req.body.meta;
            if (user.devices.indexOf(req.body.meta.deviceId) === -1) {
              user.devices.push(req.body.meta.deviceId);
            }

            // SET LOCATION
            for (var pName in req.body.location) {
              if (typeof req.body.location[pName] === 'string') {
                req.body.location[pName] = pName !== 'countryCode' ? req.body.location[pName].toLowerCase() : req.body.location[pName];
              }
            }

            if (req.body.location && req.body.location.lat && req.body.location.lng && req.body.location.country && req.body.location.city) {
              user.address = { country: req.body.location.country, city: req.body.location.city, countryCode: req.body.location.countryCode || null };
              user.settings.devices[req.headers['x-device-id'] || user.meta.deviceId] = {
                address: user.address,
                location: new app.loopback.GeoPoint({lat: req.body.location.lat, lng: req.body.location.lng})
              };
            }

            var setAchievementPromise = new Promise(function(resolve, reject) {
              AchievementsManager({
                type: 'user_login',
                user: user,
                resolve: resolve
              });
            });

            setAchievementPromise.then(function(err) {

              user.save(function(err) {
                if (CheckSave(err, res)) {
                  user.accessTokens(function(err, accessTokens) {

                    res.json({
                      code: 0,
                      data: {
                        accessToken: token.id,
                        accessTokenExpire: new Date(token.created).getTime() + (token.ttl * 1000),
                        refreshToken: token.refreshToken,
                        authInfo: {
                          id: user.id,
                          username: user.username,
                          firstName: user.firstName,
                          lastName: user.lastName,
                          photo: user.photo,
                          categories: user.categories
                        }
                      }
                    });

                  });
                }
              });

            });
          } else {
            res.status(404);
            res.json({
              code: '000-404',
              message: 'User not found',
              errors: []
            });
          }

        });
      } else {
        res.status(404);
        res.json({
          code: '001-404',
          message: 'Incorrect credential',
          errors: []
        });
      }
    });
  });

};
