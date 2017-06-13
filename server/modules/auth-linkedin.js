var Passport = require('passport'),
    LinkedinTokenStrategy = require('passport-linkedin-token-oauth2').Strategy,
    UniversalRegAuth = require('./universalRegAuth'),
    DownloadUploadFile = require('./downloadUploadFile'),
    app = require('../server');

module.exports = function(req, res) {

  var LinkedinProfile = app.models.LinkedinProfile,
      linkedinCredentials = app.get('linkedinCredentials');

  Passport.use(new LinkedinTokenStrategy({
      clientID: linkedinCredentials.clientKey,
      clientSecret: linkedinCredentials.clientSecret
    }, function(accessToken, refreshToken, profile, next) {

      profile.expiredAt = new Date().getTime() + (60 * 24 * 60 * 60 * 1000);

      function nextStep(err, imagePath) {
        if (imagePath) {
          profile.photo = imagePath;
        }

        LinkedinProfile.findById(profile.id, function(err, linkedinProfile) {
          if (!err && linkedinProfile) {
            return next(null, profile, linkedinProfile)
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


  req.body.accessToken && (req.body.access_token = req.body.accessToken);
  Passport.authenticate('linkedin-token', function(err, profile, linkedinProfile) {
    linkedinProfile && linkedinProfile.hasOwnProperty('oauthError') && (err = true);
    UniversalRegAuth(req, res, err, profile, linkedinProfile, 'LinkedinProfile');
  })(req, res);

};
