module.exports = function(app, options) {

  var User = app.models.UserModel,
      UserHistory = app.models.UserHistory,
      Role = app.models.Role,
      RoleMapping = app.models.RoleMapping;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var errors;
    var newUser = {
          password: req.body.password,
          status: 2 // first session
        };

    req.body.username && (newUser.username = req.body.username.trim());
    req.body.email && (newUser.email = req.body.email.toLowerCase());
    req.body.gender && (newUser.gender = req.body.gender);
    req.body.dob && (newUser.dob = req.body.dob);

    if (!newUser.email || !newUser.username || !newUser.password || !(req.body.meta && req.body.meta.deviceId && req.body.meta.versionApp)) {
      errors = [];

      if (!newUser.email) {
        errors.push({ errorCode: '000-002', errorMessage: 'email field is required', errorField: 'email' });
      }
      if (!newUser.username) {
        errors.push({ errorCode: '000-002', errorMessage: 'username field is required', errorField: 'username' });
      }
      if (!newUser.password) {
        errors.push({ errorCode: '000-002', errorMessage: 'password field is required', errorField: 'password' });
      }

      if (!req.body.meta) {
        errors.push({ errorCode: '000-002', errorMessage: 'meta field is required', errorField: 'meta' });
      } else {
        if (!req.body.meta.deviceType) {
          errors.push({ errorCode: '000-002', errorMessage: 'meta.deviceType field is required', errorField: 'meta.deviceType' });
        }
        if (!req.body.meta.deviceId) {
          errors.push({ errorCode: '000-002', errorMessage: 'meta.deviceId field is required', errorField: 'meta.deviceId' });
        }
        if (!req.body.meta.versionApp) {
          errors.push({ errorCode: '000-002', errorMessage: 'meta.versionApp field is required', errorField: 'meta.versionApp' });
        }
      }

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    if (newUser.password === newUser.username) {
      res.status(400);
      res.json({
        code: '001-001',
        message: 'Username and password should not be the same',
        errors: []
      });

      return;
    }

    if (req.body.password.length < app.get('validations').password.min) {
      res.status(400);
      res.json({
        code: '000-004',
        message: 'Password is too short',
        errors: []
      });

      return;
    }

    newUser.meta = req.body.meta;
    newUser.devices = [req.body.meta.deviceId];

    // SET LOCATION
    for (var pName in req.body.location) {
      if (typeof req.body.location[pName] === 'string') {
        req.body.location[pName] = pName !== 'countryCode' ? req.body.location[pName].toLowerCase() : req.body.location[pName];
      }
    }

    if (req.body.location && req.body.location.lat && req.body.location.lng && req.body.location.country && req.body.location.city) {
      newUser.address = { country: req.body.location.country, city: req.body.location.city, countryCode: req.body.location.countryCode || null };
      newUser.settings = { devices: {} };
      newUser.settings.devices[req.headers['x-device-id'] || newUser.meta.deviceId] = {
        address: newUser.address,
        location: new app.loopback.GeoPoint({lat: req.body.location.lat, lng: req.body.location.lng})
      };
    }

    User.create(newUser, function(err, user) {

      if (!err && user) {
        var userType = 'user';
        Role.findOne({where: {name: userType}}, function(err, role) {

          if (!err && role) {
            role.principals.create({
              principalType: RoleMapping.USER,
              principalId: user.id
            }, function(err) {
              if (err) throw err;

              // CREATE USER HISTORY PROFILE
              UserHistory.create({userId: user.id}, function(err) {
                if (err) throw err;

                user.createAccessToken(2592000, function (err, token) {
                  if (token) {
                    res.json({
                      code: 0,
                      data: {
                        accessToken: token.id,
                        accessTokenExpire: new Date(token.created).getTime() + (token.ttl * 1000),
                        refreshToken: token.refreshToken,
                        authInfo: {
                          id: user.id
                        }
                      }
                    });
                  } else {
                    res.status(400);
                    res.json({
                      code: '001-004',
                      message: 'Access token is expired',
                      errors: []
                    });
                  }
                });
              });

            });
          } else {
            res.status(500);
            res.json({
              code: '000-500',
              message: err ? err.message : 'Incorrect User type',
              errors: []
            });
          }

        });
      } else {
        var message = 'Create User is failed';
        errors = [];

        if (err && err.details && err.details.codes) {
          message = 'Validation error';
          for (var pName in err.details.codes) {
            if (err.details.codes.hasOwnProperty(pName)) {
              if ('username' === pName || pName === 'email') {
                errors.push({ errorCode: '002-001', errorMessage: pName + ' already exist', errorField: pName });
              }
            }
          }
        }

        if (!errors.length && err && err.message) {
          message = err.message;
        }

        res.status(400);
        res.json({ code: '002-001', message: message, errors: errors });
      }

    });

  });

};
