var config = require('../config');

module.exports = function(server) {

  server.dataSources.filestorage.connector.allowedContentTypes = config.images.uploadFormats;
  server.dataSources.filestorage.connector.maxFileSize = config.maxFileSize * 1024 * 1024;

  server.dataSources.filestorage.connector.getFilename = function(file, req, res) {
    var nowTime = new Date().getTime(),
        nowTimePart = String(nowTime).slice(7),
        fileTypeParts = file.type.split('/'),
        format = fileTypeParts[fileTypeParts.length - 1],
        filePath = file.container.slice(0, 1) + '-' + Math.floor(Math.random() + Number(nowTimePart) * 100000).toString(36) + nowTimePart + '.' + format;

    return filePath;
  }

};
