var Passport = require('passport'),
    Request = require('request'),
    GoogleTokenStrategy = require('passport-google-plus-token'),
    UniversalRegAuth = require('./universalRegAuth'),
    DownloadUploadFile = require('./downloadUploadFile'),
    app = require('../server');

module.exports = function(req, res) {

  var GoogleProfile = app.models.GoogleProfile,
      googleCredentials = app.get('googleCredentials');


  Passport.use(new GoogleTokenStrategy({
      clientID: googleCredentials.clientId,
      clientSecret: googleCredentials.clientSecret,
      passReqToCallback: true,
      accessTokenField: 'accessToken'
    }, function(req, accessToken, refreshToken, profile, next) {

      if (accessToken) {
        Request('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken, function (error, response, body) {
          var expiresIn;

          if (!error && response.statusCode == 200) {
            expiresIn = JSON.parse(body).expires_in || null;
            profile.expiredAt = new Date().getTime() + (expiresIn * 1000)
          }

          function nextStep(err, imagePath) {
            if (imagePath) {
              profile.photo = imagePath;
            }

            GoogleProfile.findById(profile.id, function(err, googleProfile) {
              if (!err && googleProfile) {
                return next(null, profile, googleProfile)
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
        });
      } else {
        res.status(400);
        res.json({
          code: '001-004',
          message: 'Access token is expired',
          errors: []
        });
      }
    }
  ));


  Passport.authenticate('google-plus-token', function(err, profile, googleProfile) {
    UniversalRegAuth(req, res, err, profile, googleProfile, 'GoogleProfile');
  })(req, res);

};
