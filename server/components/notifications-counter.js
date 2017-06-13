var CheckToken = require('../modules/check-token'),
    filterParser = require('../modules/filter-parser');

module.exports = function(app, options) {

  var SystemNotification = app.models.SystemNotification;


  /*
   // GET
   */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var reqParams = {
        where: {}
      };

    req.query.filter && (reqParams.where = filterParser(req.query.filter));
    reqParams.where.userId = String(req.accessToken.userId);

    SystemNotification.count(reqParams.where, function(err, count) {
      res.json({
        code: 0,
        data: count || 0
      });
    });

  });

};
