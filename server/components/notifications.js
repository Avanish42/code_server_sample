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

    var limit = parseInt(req.query.pageSize) || 10,
      skip = (parseInt(req.query.page) - 1 || 0) * limit,
      reqParams = {
        limit: limit,
        skip: skip,
        order: 'createdAt DESC',
        where: {}
      };

    req.query.filter && (reqParams.where = filterParser(req.query.filter));
    reqParams.where.userId = req.accessToken.userId + '';

    SystemNotification.find(reqParams, function(err, sysNots) {
      if (err || !sysNots || !sysNots.length) {
        return res.json({
          code: 0,
          data: []
        });
      }

      SystemNotification.updateAll({userId: req.accessToken.userId || 'ghost', statusBadge: 0}, {statusBadge: 1}, function (err, info) {
        res.json({
          code: 0,
          data: sysNots
        });
      });
    });

  });

};
