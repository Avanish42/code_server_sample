var Promise = require('promise'),
  CheckToken = require('../modules/check-token'),
  CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  var User = app.models.UserModel;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    User.findById(req.params.id, function(err, remoteUser) {
      if (err || !remoteUser) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'User not found',
          errors: []
        });

        return;
      }

      var remoteUserPromise = new Promise(function(resolve, reject) {
        if (remoteUser.followers.indexOf(req.accessToken.userId + '') !== -1) {
          // Remove user data from remoteUser params
          remoteUser.followers = remoteUser.followers.filter(function(follower) {
            if (follower !== req.accessToken.userId + '') {
              return follower;
            }
          });

          remoteUser.save(function(err) {
            if (CheckSave(err, res)) {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });

      remoteUserPromise.then(function() {
        req.accessToken.user(function(err, iUser) {
          if (iUser.following.indexOf(req.params.id + '') !== -1) {
            iUser.following = iUser.following.filter(function(following) {
              if (following !== remoteUser.id + '') {
                return following;
              }
            });

            iUser.save(function(errIUserSave) {
              if (CheckSave(errIUserSave, res)) {
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
    });
  });

};
