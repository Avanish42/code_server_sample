var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var SystemNotification = app.models.SystemNotification;


  /*
   // GET
   */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    SystemNotification.findById(req.params.id, function(err, sysNot) {
      if (err || !sysNot) {
        res.status(404);
        res.json({
          code: '000-404',
          message: 'Notification not found',
          errors: []
        });

        return;
      }

      if (!sysNot.statusRead) {
        sysNot.updateAttributes({statusRead: 1, statusBadge: 1}, function (err, instance) {
          res.json({
            code: 0,
            data: sysNot
          });
        })
      } else {
        res.json({
          code: 0,
          data: sysNot
        });
      }
    });

  });

};
