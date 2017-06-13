var filterParser = require('../modules/filter-parser'),
    CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var Achievement = app.models.Achievement;


  /*
  // GET
  */
  app.get(options.url, function (req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var limit = parseInt(req.query.pageSize) || 10,
        skip = (parseInt(req.query.page) - 1 || 0) * limit,
        reqParams = {
          limit: limit,
          skip: skip
        };

    if (req.query.filter) {
      reqParams.where = filterParser(req.query.filter);
    }

    if (req.query.query) {
      !reqParams.where && (reqParams.where = {});
      reqParams.where.title = {regexp: req.query.query + '/i'};
    }

    Achievement.find(reqParams, function (err, achievements) {
      res.json({
        code: 0,
        data: achievements
      });
    });
  });

};
