module.exports = function (systemNotification) {

  systemNotification.observe('before save', function (ctx, next) {
    var instance = ctx[ctx.instance ? 'instance' : 'currentInstance'];
    if (instance) {
      !instance.createdAt && (instance.createdAt = new Date().getTime());
    }
    next();
  });

};
