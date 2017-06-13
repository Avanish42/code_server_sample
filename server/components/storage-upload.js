var GM = require('gm'),
    async = require('async'),
    DSConfig = require('../datasources'),
    CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var Container = app.models.Container;


  /*
  // POST
  */
  app.post(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var imagesRootDir = DSConfig.filestorage.root,
        imageSizes = app.get('images').sizes,
        dirPath = __dirname.replace(/\\/g, '/').replace('/server/components', '/');

    Container.upload(req, res, function(err, response) {
      var container = response.files,
          counter = 0,
          tasks = {
            errors: [],
            data: []
          };

      if (err || !response || !container) {
        res.status(500);
        res.json({
          code: '000-500',
          message: err || 'File upload is failed',
          errors: []
        });

        return;
      }

      Object.keys(container).forEach(function (pName) {
        //
        container[pName].forEach(function(item) {
          //
          Object.keys(imageSizes).forEach(function (sizeName) {

            GM(dirPath + imagesRootDir + '/' + item.container + '/' + item.name)
              .resize(imageSizes[sizeName][0], imageSizes[sizeName][1]/*, '!'*/)
              .autoOrient()
              .write(dirPath + imagesRootDir + '/' + item.container + '_' + sizeName + '/' + item.name, function (err) {
                counter++;

                if (err) {
                  tasks.errors.push(err || 'File upload is failed');
                } else {
                  item.path = app.get('basePath') + 'Containers/' + item.container + '/download/' + item.name;
                  tasks.data.push(item);
                }

                if (Object.keys(container).length * container[pName].length * Object.keys(imageSizes).length === counter) {
                  callAsync(tasks);
                }
              });
          });
        });
      });


      function callAsync(tasks) {
        if (tasks.errors.length) {
          var error = tasks.errors.map(function (err) {
            if (typeof(err) === 'object') {
              err = String(err);
            }

            return err;
          });

          res.status(500);
          res.json({
            code: '000-500',
            message: error || 'File upload is failed',
            errors: []
          });

          return;
        }

        res.json({
          code: 0,
          data: container
        });
      }


    });

  });

};
