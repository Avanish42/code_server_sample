var fs = require('fs'),
    GM = require('gm'),
    Request = require('request'),
    DSConfig = require('../datasources');

module.exports = function (params, cb) {
  var app = params.app,
      container = params.container,
      url = params.url;

  var Container = app.models.Container,
      nowTime = new Date().getTime(),
      nowTimePart = String(nowTime).slice(7),
      format = 'jpg',
      imageSizes = app.get('images').sizes,
      imagesRootDir = DSConfig.filestorage.root,
      dirPath = __dirname.replace(/\\/g, '/').replace('/server/modules', '/'),
      fileName = Math.floor(Math.random() + Number(nowTimePart) * 100000).toString(36) + nowTimePart + '.' + format,
      filePath = dirPath + imagesRootDir + '/' + container + '/',
      stream = Container.uploadStream(container, fileName),
      counter = 0;

  Request(
    {
      url: url,
      method: 'GET',
      qs: {
        width: imageSizes.l[0],
        height: imageSizes.l[1]
      }
    }
  ).pipe(stream);

  stream.on('finish', function() {
    //
    stream.close(function () {
      //
      Object.keys(imageSizes).forEach(function (sizeName) {
        //
        GM(filePath + fileName)
          .resize(imageSizes[sizeName][0], imageSizes[sizeName][1]/*, '!'*/)
          .write(dirPath + imagesRootDir + '/' + container + '_' + sizeName + '/' + fileName, function (err) {
            counter++;

            if (Object.keys(imageSizes).length === counter) {
              cb(null, '/Containers/' + container + '/download/' + fileName);
            }
          });
      });
    });
  });

  stream.on('error', cb);

};
