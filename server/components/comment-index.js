var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var Comment = app.models.Comment;


  /*
   // GET
   */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var reqParams = {
      where: {
        id: req.params.id
      },
      fields: ['id', 'parentId'],
      order: 'createdAt ASC'
    };

    Comment.findOne(reqParams, function(err, comment) {
      if (err || !comment) {
        return res.json({
          code: 0,
          data: null
        });
      }

      Comment.find({where: {parentId: comment.parentId}}, function(err, comments) {
        var commentsId = comments.map(function(item) {
              return String(item.id);
            }),
            index = commentsId.indexOf(String(comment.id));

        res.json({
          code: 0,
          data: {
            index: index
          }
        })
      });
    });
  });

};
