var Promise = require('promise');

module.exports = function (app, options) {

  var AccessToken = app.models.AccessTokenModel,
      User = app.models.UserModel;


  /*
  // PUT
  */
  app.put(options.url, function (req, res) {

    AccessToken.findOne({where: {refreshToken: req.body.refreshToken}}, function (err, token) {

      if (err || !token) {
        res.status(400);
        res.json({
          code: '001-004',
          message: 'Refresh token is expired',
          errors: []
        });

        return;
      }

      User.findById(token.userId, function (err, user) {

        user.createAccessToken(2592000, function (err, token) {
          if (err || !token) {
            res.status(500);
            res.json({
              code: '000-500',
              message: 'Create accessToken is failed',
              errors: []
            });

            return;
          }

          var displayNamePromise = new Promise(function(resolve, reject) {
            var displayName = null;

            if (!user.accountRelations || !user.accountRelations.length) {
              displayName = user.displayName || null;
              resolve(displayName);
            } else {
              if (Object.keys(user.accountRelations)[0]) {
                var socialKey = Object.keys(user.accountRelations)[0],
                    socialProfileName = socialKey.substring(0, socialKey.length - 2),
                    socialProfileModelName = socialProfileName + 'Profile';

                user[socialProfileModelName](function(err, socialProfile) {
                  displayName = socialProfile.lastName + ' ' + socialProfile.firstName;
                  resolve(displayName);
                });
              }
            }
          });

          displayNamePromise.then(function(displayName) {
            res.json({
              data: {
                accessToken: token.id,
                accessTokenExpire: new Date(token.created).getTime() + (token.ttl * 1000),
                refreshToken: token.refreshToken,
                authInfo: {
                  displayName: displayName,
                  userId: user.id
                }
              }
            });
          });
        });

      });

    });

  });

};
