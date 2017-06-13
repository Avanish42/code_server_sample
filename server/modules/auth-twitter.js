var Passport = require('passport'),
    TwitterTokenStrategy = require('passport-twitter-token'),
    UniversalRegAuth = require('./universalRegAuth'),
    DownloadUploadFile = require('./downloadUploadFile'),
    app = require('../server');

module.exports = function(req, res) {

  var TwitterProfile = app.models.TwitterProfile,
      twitterCredentials = app.get('twitterCredentials');


  Passport.use(new TwitterTokenStrategy({
      consumerKey: twitterCredentials.clientKey,
      consumerSecret: twitterCredentials.clientSecret,
      oauthTokenField: 'accessToken',
      oauthTokenSecretField: 'accessTokenSecret',
      userIdField: 'userID'
    }, function(token, tokenSecret, profile, next) {

      profile.expiredAt = new Date().getTime() + (356 * 24 * 60 * 60 * 1000);

      function nextStep(err, imagePath) {
        if (imagePath) {
          profile.photo = imagePath;
        }

        TwitterProfile.findById(profile.id, function(err, twitterProfile) {
          if (!err && twitterProfile) {
            return next(null, profile, twitterProfile)
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


  Passport.authenticate('twitter-token', function(err, profile, twitterProfile) {
    UniversalRegAuth(req, res, err, profile, twitterProfile, 'TwitterProfile');
  })(req, res);

};
