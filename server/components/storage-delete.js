var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var Container = app.models.Container;


  /*
  // DELETE
  */
  app.delete(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    Container.removeFile(req.params.container, req.params.file, function(err, response) {
      if (err) {
        res.status(500);
        res.json({
          code: '000-500',
          message: err ? err.message : 'No such file or directory',
          errors: []
        });

        return;
      }

      if (req.query.fromField) {
        postRemoveFromField(req, res);
      } else {
        res.json({
          code: 0,
          data: null
        });
      }
    });

  });


  var postRemoveFromField = function (req, res) {

    if (req.params.container === 'users') {
      clearField();
    } else if ('reviews' === req.params.container || req.params.container === 'brands' && req.query.id) {
      clearField();
    } else {
      res.json({
        code: 0,
        data: null
      });
    }

    function clearField() {
      var containerName = req.params.container,
          modelName = containerName.charAt(0).toUpperCase() + containerName.slice(1).substr(0, containerName.length - 2),
          id = req.query.id,
          nullData = null;

      if (modelName.toLowerCase() === 'user') {
        modelName += 'Model';
        id = req.accessToken.userId;
      }
      if (modelName.toLowerCase() === 'review') {
        nullData = [];
      }

      app.models[modelName].findById(id, function (err, instance) {
        if (err || !instance || !instance[req.query.fromField] || instance[req.query.fromField].indexOf(req.params.file) === -1) {
          return res.json({
            code: 0,
            data: null
          });
        }

        var updateObj = {};

        updateObj[req.query.fromField] = nullData;
        instance.updateAttributes(updateObj, function (err, instance) {
          res.json({
            code: 0,
            data: null
          });
        });

      });
    }
  };

};
