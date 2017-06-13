var AuthFacebook = require('../modules/auth-facebook'),
    AuthGoogle = require('../modules/auth-google'),
    AuthTwitter = require('../modules/auth-twitter'),
    AuthLinkedin = require('../modules/auth-linkedin');

module.exports = function(app, options) {

  /*
  // POST
  */
  app.post(options.url, function (req, res) {
    if (!req.body.social) {
      return errMessage('social');
    }
    if (!req.body.accessToken) {
      return errMessage('accessToken');
    }

    var socialName = req.body.social.toLowerCase();

    if (socialName === 'facebook') {
      AuthFacebook(req, res);
    } else if(socialName === 'google') {
      AuthGoogle(req, res);
    } else if(socialName === 'twitter') {
      AuthTwitter(req, res);
    } else if(socialName === 'linkedin') {
      AuthLinkedin(req, res);
    } else {
      errMessage('social');
    }

    function errMessage(errType) {
      if (errType === 'social') {
        res.status(500);
        res.json({
          code: '000-500',
          message: 'Unknown Social Net',
          errors: []
        });
      }
      if (errType === 'accessToken') {
        res.status(400);
        res.json({
          code: '000-002',
          message: 'Access token is expired',
          line: '47',
          errors: [{ errorCode: '000-002', errorMessage: '', errorField: errType }]
        });
      }
    }
  });

};
