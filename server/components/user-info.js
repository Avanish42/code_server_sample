var CheckToken = require('../modules/check-token'),
    Helper = require('../modules/helper');

module.exports = function(app, options) {

  var User = app.models.UserModel,
      Review = app.models.Review;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var reqParams = {
      where: req.params
    };

    req.accessToken.user(function(err, currentUser) {
      //
      User.findOne(reqParams, function(err, user) {
        if (err || !user) {
          res.status(404);
          res.json({
            code: '000-404',
            message: err && err.message ? err.message : 'User not found',
            errors: []
          });

          return;
        }

        var userJSON = user.toJSON(),
            country = user.settings.devices[user.meta.deviceId] ? user.settings.devices[user.meta.deviceId].address.country : null,
            city = user.settings.devices[user.meta.deviceId] ? user.settings.devices[user.meta.deviceId].address.city : null;

        country && (country = Helper.capitalizeFirstLetter(country));
        city && (city = Helper.capitalizeFirstLetter(city));

        if (user.settings.devices[user.meta.deviceId]) {
          userJSON.location = {
            country: country,
            city: city,
            countryCode: user.settings.devices[user.meta.deviceId].address.countryCode || null,
            lat: user.settings.devices[user.meta.deviceId].location.lat,
            lng: user.settings.devices[user.meta.deviceId].location.lng
          };
        }

        if (userJSON.address) {
          if (userJSON.address.country) {
            userJSON.address.country = Helper.capitalizeFirstLetter(userJSON.address.country);
          }
          if (userJSON.address.city) {
            userJSON.address.city = Helper.capitalizeFirstLetter(userJSON.address.city);
          }
        }

        userJSON.reviewsSum = user.reviews.length;
        userJSON.followersSum = user.followers.length;
        userJSON.achievementsSum = user.achievements.length;
        userJSON.iSubscriber = currentUser ? currentUser.following.indexOf(String(userJSON.id)) !== -1: false;

        user.reviews && (delete userJSON.reviews);
        user.achievements && (delete userJSON.achievements);
        user.settings && (delete userJSON.settings);
        user.meta && (delete userJSON.meta);
        user.createdAt && (delete userJSON.createdAt);
        user.modifiedAt && (delete userJSON.modifiedAt);

        /*
        // Get uploaded images sum (Review)
        */
        Review.find({where: {id: {inq: user.reviews}}}, function(err, reviews) {
          if (err || !reviews) {
            res.json({
              code: 0,
              data: userJSON
            });

            return;
          }

          userJSON.reviewsImageSum = 0;

          reviews.forEach(function(review) {
            if (review.images) {
              userJSON.reviewsImageSum += review.images.length;
            }
          });

          res.json({
            code: 0,
            data: userJSON
          });
        });
      });
      //
    });

  });

};
