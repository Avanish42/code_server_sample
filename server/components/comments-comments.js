var Promise = require('promise'),
    AchievementsManager = require('../modules/achievements-manager'),
    CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save'),
    Helper = require('../modules/helper');

module.exports = function(app, options) {

  var Comment = app.models.Comment,
      Review = app.models.Review,
      User = app.models.UserModel;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    if (!(req.body.text && req.body.text.length)) {
      var errors = [
        { errorCode: '000-002', errorMessage: 'Field required', errorField: 'text' }
      ];

      res.status(400);
      res.json({ code: '000-002', message: 'Field(s) not exists', errors: errors });

      return;
    }

    var reqParams = {
          where: req.params,
          include: [
            {
              relation: 'user',
              scope: {
                fields: ['id', 'email']
              }
            }
          ]
        };

    // create comment
    Comment.findOne(reqParams, function(err, comment) {

      if (err || !comment) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Comment not found',
          errors: []
        });

        return;
      }

      var commentJSON = comment.toJSON(),
          newComment = {
            authorId: req.accessToken.userId,
            text: req.body.text,
            parentId: comment.parentId,
            onCommentId: comment.id
          };

      Comment.create(newComment, function(err, anyComment) {
        if (err || !anyComment) {
          res.status(500);
          res.json({
            code: '000-500',
            message: 'Create comment is failed',
            errors: []
          });

          return;
        }

        // >>> find review
        Review.findById(anyComment.parentId, function(err, review) {
          review.comments.push(String(anyComment.id));

          review.save(function(err) {
            comment.comments.push(String(anyComment.id));

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

                  user.comments.push(String(anyComment.id));

                  // SYSTEM NOTIFICATION
                  User.emit('systemSend', {
                    state: 'commentReplied',
                    comment: comment,
                    follower: user
                  });

                  // Notification NEW COMMENT
                  if (user.settings.notifications.comments.email) {
                    User.emit('emailSend', {
                      state: 'newCommentOnComment',
                      user: commentJSON.user,
                      follower: {
                        id: req.accessToken.userId
                      },
                      email: commentJSON.user.email,
                      parent: comment,
                      newComment: anyComment
                    });
                  }

                  var setAchievementPromise = new Promise(function(resolve, reject) {
                    AchievementsManager({
                      type: 'add_comment',
                      user: user,
                      resolve: resolve
                    });
                  });

                  setAchievementPromise.then(function(response) {
                    user.save(function(err) {
                      if (CheckSave(err, res)) {
                        if (req.body.tagedId) {
                          // SYSTEM NOTIFICATION TO TAGED
                          Comment.app.models.UserModel.emit('systemSend', {
                            state: 'tagedPost',
                            comment: anyComment,
                            follower: user,
                            usersId: req.body.tagedId
                          });
                        }

                        var anyCommentJSON = anyComment.toJSON();
                        anyCommentJSON.user = Helper.mask(user, 'id,username,firstName,lastName,photo');

                        res.json({
                          code: 0,
                          data: anyCommentJSON
                        });
                      }
                    });
                  });

                });

              }
            });
          });

        });
        // <<< find review

      });

    });
  });

};
