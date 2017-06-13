module.exports = function (Category) {

  Category.observe('before save', function (ctx, next) {
    var instance = ctx[ctx.instance ? 'instance' : 'currentInstance'];
    if (instance) {
      !instance.createdAt && (instance.createdAt = new Date().getTime());
      instance.modifiedAt = new Date().getTime();
    }
    next();
  });

};
