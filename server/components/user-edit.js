var CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  /*
  // PUT
  */
  app.put(options.url, function(req, res) {
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

      var availableFields = ['username', 'email', 'firstName', 'lastName', 'gender', 'dob', 'phone', 'photo', 'meta', 'incomeRange'],
          hasChanges = false;

      for (var pName in req.body) {
        if (req.body.hasOwnProperty(pName) && availableFields.indexOf(pName) !== -1) {
          hasChanges = true;

          if (pName === 'photo') {
            // photo
            user[pName] = req.body[pName].replace(app.get('basePath'), '/');
          } else if (pName === 'gender') {
            // gender
            user[pName] = parseInt(req.body[pName]);
          } else {
            user[pName] = req.body[pName];
          }
        }
      }

      // SET Address || location
      var type;

      for (var locName in req.body.location) {
        if (req.body.location.hasOwnProperty(locName) && req.body.location[locName]) {

          type = 'country' === locName || locName === 'city' ? 'address' : 'location';

          switch (locName) {
            case 'country':
              type = 'address';
              break;
            case 'city':
              type = 'address';
              break;
            case 'countryCode':
              type = 'address';
              break;
            case 'lat':
              type = 'location';
              break;
            case 'lng':
              type = 'location';
              break;
            default:
              type = null;
          }


          if (!req.headers['x-device-id'] && !user.meta.deviceId) {
            var errors = [];

            res.status(400);

            if (!user.meta.deviceId) {
              errors.push({ errorCode: '000-002', errorMessage: 'meta.deviceId field is required', errorField: 'meta.deviceId' });
            }

            res.json({code: '000-002', message: 'Please set `deviceId`', errors: errors});
            return;
          }

          var deviceSource = user.settings.devices[req.headers['x-device-id'] || user.meta.deviceId];

          if (!deviceSource) {
            deviceSource = { address: {}, location: {} };
          }

          if (type) {
            if (type === 'address') {
              var value = locName !== 'countryCode' ? req.body.location[locName].toLowerCase() : req.body.location[locName];
              user[type][locName] = value;
              deviceSource[type][locName] = value;
            } else {
              deviceSource[type][locName] = +req.body.location[locName];
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
        });
      } else {
        res.json({
          code: 0,
          data: null
        });
      }
    });
  });
};
