module.exports = function (Review) {


  /*
   // PREVENTS
   */
  Review.observe('before save', function (ctx, next) {
    var instance = ctx[ctx.instance ? 'instance' : 'currentInstance'];
    if (instance) {
      !instance.createdAt && (instance.createdAt = new Date().getTime());
      instance.modifiedAt = new Date().getTime();
    }
    next();
  });


  /*
   // EXTEND METHODS
   */
  Review._delete = function (reviewId, cb) {
    var errJSON;
    // REVIEW SCOPE >>>
    Review.findById(reviewId, function (err, review) {
      if (err || !review) {
        errJSON = {
          code: '000-404',
          message: 'Review not found',
          errors: []
        };
        cb(errJSON, null);
        return;
      }

      review.destroy(function (err, destroyReviewId) {

        // CONTAINER SCOPE >>>
        var imgParts = review.image ? review.image.split('/') : null,
            containerName,
            fileName;

        if (imgParts) {
          containerName = imgParts[imgParts.length - 2];
          fileName = imgParts[imgParts.length - 1];
        }

        // remove relative file
        Review.app.models.Container.removeFile(containerName, fileName, function (err, info) {

          // REVIEW SCOPE >>>
          Review.app.models.Brand.findById(review.brandId, function (err, brand) {
            if (err || !brand) {
              errJSON = {
                code: '000-404',
                message: 'Brand not found',
                errors: []
              };
              cb(errJSON, null);
              return;
            }

            // remove from reviews list
            brand.reviews = brand.reviews.filter(function (id) {
              if (id !== reviewId) {
                return id;
              }
            });

            brand.avgRateSum -= review.rate;
            brand.avgRate = Math.round((brand.avgRateSum / brand.reviews.length) * 100) / 100;

            brand.updateAttributes({reviews: brand.reviews, avgRateSum: brand.avgRateSum, avgRate: brand.avgRate}, function (err, instance) {
              if (err) {
                errJSON = {
                  code: '000-500',
                  message: 'Process of updating relations failed',
                  errors: []
                };
                cb(errJSON, null);
                return;
              }

              // USER SCOPE >>>
              Review.app.models.UserModel.findById(review.authorId, function (err, user) {
                if (err || !user) {
                  errJSON = {
                    code: '000-404',
                    message: 'User not found',
                    errors: []
                  };
                  cb(errJSON, null);
                  return;
                }

                user.reviews = user.reviews.filter(function (id) {
                  if (id !== String(reviewId)) {
                    return id;
                  }
                });

                user.updateAttributes({reviews: user.reviews}, function (err, instance) {
                  if (err) {
                    errJSON = {
                      code: '000-404',
                      message: 'Process of updating relations failed',
                      errors: []
                    };
                    cb(errJSON, null);
                    return;
                  }

                  cb(null, destroyReviewId);
                });
              });
              // USER SCOPE <<<
            });
          });
          // BRAND SCOPE <<<
        });
      });
    });
    // REVIEW SCOPE <<<
  };

  Review.remoteMethod(
    '_delete',
    {
      http: {path: '/_delete'},
      accepts: {arg: 'reviewId', type: 'string', required: true},
      returns: {arg: 'status', type: 'object'}
    }
  );

};
