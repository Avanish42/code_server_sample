module.exports = function(Container) {


  /*
   // PREVENTS
   */
  Container.beforeRemote('download', function (ctx, result, next) {
    var imageSize = ctx.req.query.size;

    if (imageSize) {
      var suffix = '_' + imageSize.toLowerCase();

      if (ctx.req.params.container.indexOf(suffix) === -1) {
        ctx.args.container = ctx.req.params.container + suffix;
      }
    }

    next();
  });

};
