var Passport = require('passport'),
    FacebookTokenStrategy = require('passport-facebook-token'),
    UniversalRegAuth = require('./universalRegAuth'),
    DownloadUploadFile = require('./downloadUploadFile'),
    app = require('../server');

module.exports = function(req, res) {

  var FacebookProfile = app.models.FacebookProfile,
      fbCredentials = app.get('fbCredentials');


  Passport.use(new FacebookTokenStrategy({
      clientID: fbCredentials.clientId,
      clientSecret: fbCredentials.clientSecret,
      accessTokenField: 'accessToken'
    }, function(accessToken, refreshToken, profile, next) {

      function nextStep(err, imagePath) {
        if (imagePath) {
          profile.photo = imagePath;
        }

        FacebookProfile.findById(profile.id, function(err, facebookProfile) {
          if (!err && facebookProfile) {
            return next(null, profile, facebookProfile)
          } else if (profile) {
            return next(null, profile);
          } else {
            return next(true, null);
          }
        });
      }

      if (profile.photos && profile.photos.length && profile.photos[0].value) {
        DownloadUploadFile({
          app: app,
          url: profile.photos[0].value,
          container: 'users'
        }, nextStep);
      } else {
        nextStep();
      }

    }
  ));


  Passport.authenticate('facebook-token', function(err, profile, facebookProfile) {
    UniversalRegAuth(req, res, err, profile, facebookProfile, 'FacebookProfile');
  })(req, res);
};
