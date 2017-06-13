var CheckToken = require('../modules/check-token'),
    CheckSave = require('../modules/check-save');

module.exports = function(app, options) {

  var Comment = app.models.Comment;


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

      comment.text = req.body.text;
      comment.save(function(err) {
        if (CheckSave(err, res)) {
          if (req.body.tagedId) {
            // SYSTEM NOTIFICATION TO TAGED
            Comment.app.models.UserModel.emit('systemSend', {
              state: 'tagedPost',
              comment: comment,
              follower: user,
              usersId: req.body.tagedId
            });
          }

          res.json({
            code: 0,
            data: comment.id
          });
        }
      });

    });
  });


  /*
  // DELETE
  */
  app.delete(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

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

      if (String(comment.authorId) !== String(req.accessToken.userId)) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'You are not owner',
          errors: []
        });

        return;
      }

      comment.review(function(err, review) {
        review.comments = review.comments.filter(function(commentItem) {
          if (req.params.id !== commentItem) {
            return commentItem;
          }
        });

        review.save(function(err) {
          if (CheckSave(err, res)) {
            comment.destroy(function(err) {
              if (err) {
                res.status(500);
                res.json({
                  code: '000-500',
                  message: 'Destroy comment is failed',
                  errors: []
                });

                return;
              }

              res.json({
                code: 0,
                data: null
              });
            });
          }
        });
      });

    });
  });
};
