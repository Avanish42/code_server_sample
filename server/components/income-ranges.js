var filterParser = require('../modules/filter-parser');

module.exports = function(app, options) {

  var IncomeRange = app.models.IncomeRange;


  /*
  // GET
  */
  app.get(options.url, function (req, res) {
    var reqParams = {};

    if (req.query.filter) {
      reqParams.where = filterParser(req.query.filter);
    }

    function findIncomes() {
      IncomeRange.find(reqParams, function (err, incomeRanges) {
        if (!incomeRanges.length && reqParams.where.country && reqParams.where.country !== 'any') {
          reqParams.where.country = 'any';
          return findIncomes();
        }

        res.json({
          code: 0,
          data: incomeRanges
        });
      });
    }

    findIncomes();
  });

};
