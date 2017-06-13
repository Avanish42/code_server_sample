var app = require('../server'),
    crypto = require('crypto');

module.exports = function (AccessTokenModel) {

  app.use(app.loopback.token({
    model: AccessTokenModel
  }));

  AccessTokenModel.observe('before save', function (modelCtx, next) {
    modelCtx.instance.refreshToken = crypto.randomBytes(20).toString('hex');
    next();
  });

};
