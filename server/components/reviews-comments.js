var Promise = require('promise'),
    AchievementsManager = require('../modules/achievements-manager'),
    CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save'),
    Helper = require('../modules/helper');

module.exports = function(app, options) {

  var Review = app.models.Review,
      Comment = app.models.Comment,
      User = app.models.UserModel;

  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    Review.findById(req.params.id, function(err, review) {

      if (err || !review) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Review not found',
          errors: []
        });

        return;
      }

      //
      var reqParams = {
        where: {id: {inq: review.comments}},
        order: 'createdAt DESC',
        include: {
          relation: 'user',
          scope: {
            fields: ['username', 'firstName', 'lastName', 'photo']
          }
        }
      };
      //

      Comment.find(reqParams, function(err, comments) {
        if (err || !comments || !comments.length) {
          res.json({
            code: 0,
            data: []
          });

          return;
        }

        var limit = parseInt(req.query.pageSize) || 10,
            skip = (parseInt(req.query.page) - 1 || 0) * limit,
            comments4Print = [];

        // Echo Skip Reviews
        for (var i = skip; i <= skip + limit; i++) {
          if (!comments[i] || i > skip + limit - 1) {
            res.json({
              code: 0,
              data: comments4Print
            });
            return;
          } else {
            comments[i].likesCount = comments[i].likes.length;
            comments[i].commentsCount = comments[i].comments.length;
            comments4Print.push(comments[i]);
          }
        }

        res.json({
          code: 0,
          data: comments
        });

      });

    });
  });


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

    Review.findById(req.params.id, function(err, review) {

      if (err || !review) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Review not found',
          errors: []
        });

        return;
      }

      var newComment = {
        authorId: req.accessToken.userId,
        text: req.body.text,
        parentId: review.id
      };

      Comment.create(newComment, function(err, comment) {
        if (err || !comment) {
          res.status(500);
          res.json({
            code: '000-500',
            message: 'Create comment is failed',
            errors: []
          });

          return;
        }

        review.comments.push(String(comment.id));

        review.save(function(err) {
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

              user.comments.push(String(comment.id));

              User.findById(review.authorId, function(err, reviewAuthor) {
                if (err || !user) {
                  res.status(404);
                  res.json({
                    code: '000-404',
                    message: 'Author not found',
                    errors: []
                  });

                  return;
                }

                // SYSTEM NOTIFICATION ON CREATE
                User.emit('systemSend', {
                  state: 'reviewComment',
                  review: review,
                  follower: user
                });

                if (req.body.tagedId) {
                  // SYSTEM NOTIFICATION TO TAGED
                  User.emit('systemSend', {
                    state: 'tagedPost',
                    comment: comment,
                    follower: user,
                    usersId: req.body.tagedId
                  });
                }

                // Notification NEW COMMENT
                if (user.settings.notifications.comments.email) {
                  User.emit('emailSend', {
                    state: 'newCommentOnReview',
                    user: reviewAuthor,
                    follower: {
                      id: req.accessToken.userId
                    },
                    email: reviewAuthor.email,
                    parent: review,
                    newComment: comment
                  });
                }

                var setAchievementPromise = new Promise(function(resolve, reject) {
                  AchievementsManager({
                    type: 'added_comment_on_review',
                    user: reviewAuthor,
                    follower: {
                      id: req.accessToken.userId
                    },
                    review: review,
                    resolve: resolve
                  });
                });

                setAchievementPromise.then(function(err) {
                  var setAchievementPromiseSecond = new Promise(function(resolve, reject) {
                    AchievementsManager({
                      type: 'add_comment',
                      user: user,
                      resolve: resolve
                    });
                  });

                  setAchievementPromiseSecond.then(function(response) {
                    var commentJSON = comment.toJSON();
                    commentJSON.user = Helper.mask(user, 'id,username,firstName,lastName,photo');

                    user.save(function(err) {
                      if (CheckSave(err, res)) {
                        res.json({
                          code: 0,
                          data: commentJSON
                        });
                      }
                    });
                  });
                });
              });

            });

          }
        });
      });

    });
  });

};
