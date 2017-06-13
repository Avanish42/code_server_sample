var app = require('../server');

module.exports = function() {

  return function imgAbsolutePathReplace(req, res, next) {

    var send = res.send;
    res.send = function (data) {
      var body = data instanceof Buffer ? data.toString() : data;

      if (/.json/i.test(req['_parsedUrl'].pathname) || typeof body !== 'string') {
        return send.call(this, body);
      }

      var patternImage = '"/Containers/([a-z\-_0-9\/\:\.]*\.(jpe?g|png|gif)")',
          patternFullPath;

      patternFullPath = new RegExp(patternImage, 'g');

      body = body.replace(patternFullPath, function (source) {
        return '"' + app.get('basePath') + source.substring(2, source.length);
      });

      send.call(this, body);
    };

    next();
  }
};
