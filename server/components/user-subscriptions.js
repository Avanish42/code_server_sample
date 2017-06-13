var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var User = app.models.UserModel;


  /*
  // GET
  */
  app.get(options.url, function (req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    req.accessToken.user(function(err, user) {
      var limit = parseInt(req.query.pageSize) || 10,
          skip = (parseInt(req.query.page) - 1 || 0) * limit,
          reqParams = {
            limit: limit,
            skip: skip,
            where: {id: {inq: user.following}}
          };

      if (req.query.query) {
        reqParams.where.or = [
          {username: {regexp: req.query.query + '/i'}},
          {firstName: {regexp: req.query.query + '/i'}},
          {lastName: {regexp: req.query.query + '/i'}}
        ];
      }

      User.find(reqParams,
        function(err, users) {
          res.json({
            code: 0,
            data: users
          });
        });
    });
  });

};
