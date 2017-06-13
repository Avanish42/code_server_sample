var Promise = require('promise'),
    AchievementsManager = require('../modules/achievements-manager'),
    CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  var User = app.models.UserModel,
      Comment = app.models.Comment;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var userId = String(req.accessToken.userId);

    Comment.findById(req.params.id, function(err, comment) {
      if (err || !comment) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Comment not found',
          errors: []
        });

        return;
      }

      !comment.likes && (comment.likes = []);
      if (comment.likes.indexOf(userId) === -1) {
        comment.likes.indexOf(userId) === -1 && comment.likes.push(userId);
        comment.save(function(err) {
          if (CheckSave(err, res)) {

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

              // Added own like to profile
              var likeId = 'comment_' + comment.id;
              if (user.likes.indexOf(likeId) === -1) {
                user.likes.push(likeId);
              }

              user.save(function(err) {
                if (CheckSave(err, res)) {

                  // SYSTEM NOTIFICATION
                  User.emit('systemSend', {
                    state: 'commentLike',
                    comment: comment,
                    follower: user
                  });

                  var setAchievementPromise = new Promise(function(resolve, reject) {
                    AchievementsManager({
                      type: 'add_like',
                      user: user,
                      resolve: resolve
                    });
                  });

                  setAchievementPromise.then(function(response) {
                    res.json({
                      code: 0,
                      data: null
                    });
                  });
                }
              })
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


  /*
  // DELETE
  */
  app.delete(options.url, function(req ,res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var userId = req.accessToken.userId + '';

    Comment.findById(req.params.id, function(err, comment) {
      if (err || !comment) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Comment not found',
          errors: []
        });

        return;
      }

      if (comment.likes && comment.likes.length && comment.likes.indexOf(userId) !== -1) {
        comment.likes = comment.likes.filter(function(commentItem) {
          if (commentItem !== userId) {
            return commentItem;
          }
        });
        comment.save(function(err) {
          if (CheckSave(err, res)) {

            req.accessToken.user(function (err, user) {
              if (err || !user) {
                res.status(404);
                res.json({
                  code: '000-404',
                  message: 'User not found',
                  errors: []
                });

                return;
              }

              // Remove own like from profile
              var likeId = 'comment_' + comment.id;
              if (user.likes.indexOf(likeId) !== -1) {
                user.likes = user.likes.filter(function (likeIdItem) {
                  if (likeIdItem !== likeId) {
                    return likeIdItem;
                  }
                });
              }

              user.save(function (err) {
                if (CheckSave(err, res)) {
                  res.json({
                    code: 0,
                    data: null
                  });
                }
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
};
