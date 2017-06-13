var app = require('../server.js'),
    FB = require('fb');

module.exports = function (FacebookProfile) {

  FacebookProfile.observe('before save', function (ctx, next) {
    var instance = ctx[ctx.instance ? 'instance' : 'currentInstance'];
    if (instance) {
      !instance.createdAt && (instance.createdAt = new Date().getTime());
      instance.modifiedAt = new Date().getTime();
    }
    next();
  });


  FacebookProfile.prototype.getMyFriendsFromFacebook = function (token, cb) {
    var parseResponse = function (response, users, cb) {
      if (response.data && response.data.length) {
        response.data.forEach(function (item) {
          users.push(item.id);
        });
      }

      if (response.paging && response.paging.next) {
        FB.api(response.paging.next, function (response) {
          parseResponse(response, users, cb);
        })
      } else {
        cb(null, users)
      }
    };

    FB.api('/me/friends', {
      fields: ['id'],
      access_token: token
    }, function (response) {

      var users = [];

      if (!response.error) {
        parseResponse(response, users, cb);
      } else {
        cb(response.error, null);
      }
    });
  };


  FacebookProfile.prototype.renewToken = function (cb) {
    var profile = this;

    FacebookProfile.extensionToken(this.accessToken, function (err, response) {
      if (err) {
        cb(err, null)
      } else {
        profile.accessToken = response.access_token;
        profile.save(cb);
      }
    })
  };


  FacebookProfile.extensionToken = function (accessToken, cb) {
    var fbAppCredits = app.get('fbCredentials');

    FB.api('/oauth/access_token', {
      client_id: fbAppCredits.clientId,
      client_secret: fbAppCredits.clientSecret,
      fb_exchange_token: accessToken,
      grant_type: 'fb_exchange_token'
    }, function (response) {
      if (response.error) {
        cb(response.error, null)
      } else {
        cb(null, response)
      }
    });
  }
};
