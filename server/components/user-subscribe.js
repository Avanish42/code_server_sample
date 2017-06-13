var Promise = require('promise'),
    AchievementsManager = require('../modules/achievements-manager'),
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
        // Save params for remote user
        if (!remoteUser.followers || remoteUser.followers.indexOf(req.accessToken.userId + '') === -1) {
          remoteUser.followers.push(req.accessToken.userId + '');

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
          if (iUser.following.indexOf(req.params.id) === -1) {
            iUser.following.push(req.params.id);

            iUser.save(function(err) {
              // Notification NEW FOLLOWER
              if (CheckSave(err, res)) {
                // SYSTEM NOTIFICATION
                User.emit('systemSend', {
                  state: 'newFollower',
                  user: remoteUser,
                  follower: iUser
                });

                // EMAIL NOTIFICATION
                if (remoteUser.settings.notifications.followers.email) {
                  User.emit('emailSend', {
                    state: 'newFollower',
                    user: remoteUser,
                    email: remoteUser.email,
                    follower: iUser
                  });
                }

                var setAchievementPromise = new Promise(function(resolve, reject) {
                  AchievementsManager({
                    type: 'user_added_follower',
                    user: remoteUser,
                    resolve: resolve
                  });
                });

                setAchievementPromise.then(function(err) {

                  var setAchievementPromiseSecond = new Promise(function(resolve, reject) {
                    AchievementsManager({
                      type: 'add_following',
                      user: iUser,
                      resolve: resolve
                    });
                  });

                  setAchievementPromiseSecond.then(function(err) {
                    res.json({
                      code: 0,
                      data: null
                    });
                  });

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
