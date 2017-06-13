var app = require('../server'),
    Promise = require('promise'),
    CheckSave = require('../modules/check-save'),
    AchievementsManager = require('../modules/achievements-manager');

module.exports = function(req, res, err, profile, socialProfile, socialProfileModelName) {

  var User = app.models.UserModel,
      SocialProfile = app.models[socialProfileModelName],
      Role = app.models.Role,
      UserHistory = app.models.UserHistory,
      RoleMapping = app.models.RoleMapping,
      AccessToken = app.models.AccessTokenModel;

  var errors;
  var prefixName = socialProfileModelName.toLowerCase().replace('profile', '');


  if (!(req.body.meta && req.body.meta.deviceType && req.body.meta.deviceId && req.body.meta.versionApp)) {
    errors = [];

    if (!req.body.meta) {
      errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'meta' });
    } else {
      if (!req.body.meta.deviceType) {
        errors.push({ errorCode: '000-002', errorMessage: 'Field required', errorField: 'meta.deviceType' });
      }
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

  if (!err && socialProfile) {
    // User has been used
    User.findOne({where: {id: socialProfile.userId}}, function(err, user) {
      if (err || !user) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'User not found',
          errors: []
        });

        return;
      }

      if (!user.status) {
        res.status(400);
        res.json({
          code: '001-004',
          message: 'Your account has been deactivated',
          errors: []
        });

        return;
      }

      // Update photo
      if (profile.photo) {
        user.photo = profile.photo;
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

        if (req.headers['x-device-id'] || req.body.meta && req.body.meta.deviceId) {
          user.settings.devices[req.headers['x-device-id'] || req.body.meta.deviceId] = {
            address: user.address,
            location: new app.loopback.GeoPoint({lat: req.body.location.lat, lng: req.body.location.lng})
          };
        }
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
            // ACCESS_TOKEN
            user.createAccessToken(2592000, function (err, token) {
              if (err || !token) {
                res.status(400);
                res.json({
                  code: '001-004',
                  line: '119',
                  message: 'Access token is expired',
                  errors: []
                });

                return;
              }

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
            //
          }
        });

      });
    });
  } else if (profile) {
    // Registration new socialProfile
    if (req.body.password && req.body.password.length < app.get('validations').password.min) {
      res.status(400);
      res.json({
        code: '000-004',
        message: 'Password is too short',
        errors: []
      });

      return;
    }

    var nowTime = new Date().getTime(),
        availableFields = ['username', 'email', 'password', 'firstName', 'lastName', 'gender', 'dob', 'phone', 'photo', 'income', 'meta', 'incomeRange'],
        newUser = {
          status: 2, // first session
          accountRelations: {}
        };

    errors = [];

    for (var pName in req.body) {
      if (req.body.hasOwnProperty(pName) && availableFields.indexOf(pName) !== -1) {

        if (pName === 'photo') {
          // photo
          newUser[pName] = req.body[pName].replace(app.get('basePath'), '').replace(/\/*/i, '/');
        } else if (pName === 'password') {
          // password
          if (req.body[pName] && req.body[pName].length < app.get('validations').password.min) {
            errors.push({ errorCode: '000-002', errorMessage: 'Password is too short', errorField: 'password' });
          } else if (req.body[pName]) {
            newUser[pName] = req.body[pName];
          }
        } else if (pName === 'gender') {
          // gender
          newUser[pName] = parseInt(req.body[pName]);
        } else {
          newUser[pName] = req.body[pName];
        }
      }
    }

    newUser.devices = [req.body.meta.deviceId];
    newUser[prefixName + 'Id'] = profile.id;
    newUser.accountRelations[prefixName + 'Id'] = profile.id;

    // EMAIL
    if (!newUser.email) {
      if (profile.emails && profile.emails.length && profile.emails[0].value) {
        newUser.email = profile.emails[0].value;
      } else {
        newUser.email = profile.id + '@' + prefixName + '.net';
      }
    }
    // USERNAME
    if (!newUser.username) {
      newUser.username = profile.id;
    }
    // PASSWORD
    if (!newUser.password) {
      newUser.password = Math.floor(Math.random() + nowTime * 1000 * 1000).toString(36);
    }
    // PHOTO
    if (!newUser.photo && profile.photo) {
      newUser.photo = profile.photo;
    }
    // FIRST NAME
    if (!newUser.firstName && profile.name.givenName) {
      newUser.firstName = profile.name.givenName;
    }
    // LAST NAME
    if (!newUser.lastName && profile.name.familyName) {
      newUser.lastName = profile.name.familyName;
    }
    // GENDER
    if (!newUser.gender && profile.gender) {
      newUser.gender = profile.gender === 'female' ? 1 : 0;
    }
    // DOB
    if (!newUser.dob && profile.birthday && profile.birthday.length >= 8) {
      newUser.dob = new Date(profile.birthday).getTime();
    }
    // LOCATION
    for (var pName in req.body.location) {
      if (typeof req.body.location[pName] === 'string') {
        req.body.location[pName] = pName !== 'countryCode' ? req.body.location[pName].toLowerCase() : req.body.location[pName];
      }
    }

    if (req.body.location && req.body.location.lat && req.body.location.lng && req.body.location.country && req.body.location.city) {
      newUser.address = { country: req.body.location.country, city: req.body.location.city, countryCode: req.body.countryCode || null };
      newUser.settings = { devices: {} };
      if (req.headers['x-device-id'] || newUser.meta && newUser.meta.deviceId) {
        newUser.settings.devices[req.headers['x-device-id'] || newUser.meta.deviceId] = {
          address: newUser.address,
          location: new app.loopback.GeoPoint({lat: req.body.location.lat, lng: req.body.location.lng})
        };
      }
    }

    // NEW USER
    User.create(newUser, function(err, user) {
      if (err || !user) {
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

        return;
      }

      // FIND & CREATE ROLE
      var userType = 'user';
      Role.findOne({where: {name: userType}}, function(err, role) {
        if (!err && role) {
          // CREATE ROLE
          role.principals.create({
            principalType: RoleMapping.USER,
            principalId: user.id
          }, function(err) {
            if (err) throw err;

            // CREATE USER HISTORY PROFILE
            UserHistory.create({userId: user.id}, function(err) {
              if (err) throw err;

              // CREATE ACCESS_TOKEN
              user.createAccessToken(2592000, function (err, token) {
                if (err || !token) {
                  res.status(400);
                  res.json({
                    code: '001-004',
                    message: 'AccessToken create process error',
                    errors: []
                  });

                  return;
                }

                var socManipulatePromise = new Promise(function(resolve, reject) {
                  if (prefixName === 'facebook') {
                    // EXTEND FACEBOOK TOKEN
                    SocialProfile.extensionToken(req.body.accessToken, function (err, data) {
                      resolve(data);
                    });
                  } else {
                    resolve();
                  }
                });

                socManipulatePromise.then(function(data) {
                  var newSocialProfile = {
                    id: profile.id,
                    userId: user.id,
                    accessToken: req.body.accessToken,
                    photoUrl: profile.photo ? profile.photo : null,
                    fullName: profile.displayName ? profile.displayName : profile.name.givenName + ' ' + profile.name.familyName,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    gender: profile.gender,
                    expiredAt: profile.expiredAt || null
                  };

                  if (data) {
                    newSocialProfile.accessToken = data.access_token;
                    newSocialProfile.expiredAt = new Date().getTime() + (data.expires * 1000);
                  }

                  // CREATE SOCIAL PROFILE
                  SocialProfile.create(newSocialProfile, function(err, sProfile) {
                    if (err || !sProfile) {
                      var message = 'Create Social Profile is failed';
                      errors = [];

                      if (err && err.details && err.details.codes) {
                        message = 'Validation error';
                        for (var pName in err.details.codes) {
                          if (err.details.codes.hasOwnProperty(pName)) {
                            if (pName === 'id') {
                              errors.push({ errorCode: '002-001', errorMessage: 'Social account ' + pName + ' already exist', errorField: pName });
                            }
                          }
                        }
                      }

                      if (!errors.length && err && err.message) {
                        message = err.message;
                      }

                      res.status(400);
                      res.json({ code: '002-001', message: message, errors: errors });

                      return;
                    }

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
                          photo: user.photo
                        }
                      }
                    });
                  });
                });
              });
            });
          });
        } else {
          res.status(500);
          res.json({
            code: '000-500',
            message: 'Incorrect User type',
            errors: []
          });
        }
      });

    });
  } else {
    res.status(400);
    res.json({
      code: '001-004',
      message: 'Access token is expired',
      line: '399',
      errors: []
    });
  }

};
