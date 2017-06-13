var CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var User = app.models.UserModel,
      Review = app.models.Review;


  /*
  // GET
  */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var conditions = app.get('recommendations'),
        nowSeconds = new Date().getTime(),
        betweenStart = nowSeconds - (conditions.periodDateFrom * (24 * 60 * 60 * 1000)),
        reqParamsUser = {where: {}};

    Review.find({where: {createdAt: {gte: betweenStart}}}, function(err, reviews) {
      var authors = {},
          brands = {},
          authorsCount = [],
          authorsNear = [],
          authorsTotal = [];

      // Filter author has reviews on 50 brands and more
      reviews.forEach(function(review) {
        !authors[review.authorId] && (authors[review.authorId] = 0);
        brands[review.brandId] && (brands[review.brandId] = 0);
        authors[review.authorId]++;
        brands[review.brandId]++;

        if (conditions.brandsMin <= authors[review.authorId]) {
          authorsCount.push(review.authorId);
        }
        if (conditions.periodBrandsMin <= brands[review.brandId]) {
          authorsNear.push(review.authorId);
        }
      });
      //

      authorsCount.forEach(function(authorC) {
        if (authorsCount.indexOf(authorC) !== -1 && authorC + '' !== req.accessToken.userId + '') {
          authorsTotal.push(authorC);
        }
      });

      reqParamsUser.where.id = {inq: authorsTotal};
      reqParamsUser.where.followers = {neq: []};
      User.find(reqParamsUser, function(errUsers, users) {
        // Author has at least № followers
        var userFiltered = [];

        userFiltered = users.filter(function(user) {
          if (user.followers && user.followers.length >= conditions.followersMin) {
            return user;
          }
        });

        if (userFiltered.length) {
          sortUsers(userFiltered);
        } else {
          res.json({
            code: 0,
            data: userFiltered
          });
        }
        //
      });

    });

    // Sort
    function sortUsers(users) {
      var sortedUsers = [];

      // USER.xC - TEMP DATA
      req.accessToken.user(function(err, user) {
        var userInterests = [];

        user.categories && (userInterests = userInterests.concat(user.categories));
        user.subcategories && (userInterests = userInterests.concat(user.subcategories));
        user.brands && (userInterests = userInterests.concat(user.brands));

        if (userInterests.length) {
          users.forEach(function(userItem, index) {
            var userItemInterests = [];
            userItem.xC = 0;

            userItem.categories && (userItemInterests = userItemInterests.concat(userItem.categories));
            userItem.subcategories && (userItemInterests = userItemInterests.concat(userItem.subcategories));
            userItem.brands && (userItemInterests = userItemInterests.concat(userItem.brands));

            if (userItemInterests.length) {
              userInterests.forEach(function(prop) {
                if (userItemInterests.indexOf(prop) !== -1) {
                  userItem.xC++;
                }
              });
            }
          });
        }

        // Print_r users
        echoUsers(req, res, users);
      });
    }
  });


  function echoUsers(req, res, users) {
    var limit = parseInt(req.query.pageSize) || 10,
        skip = (parseInt(req.query.page) - 1 || 0) * limit,
        users4Print = [];

    // Echo Skip Users
    for (var i = skip; i <= skip + limit; i++) {
      if (!users[i] || i > skip + limit - 1) {
        res.json({
          code: 0,
          data: users4Print
        });
        return;
      } else {
        users4Print.push(users[i]);
      }
    }

    res.json({
      code: 0,
      data: downSort(users4Print)
    });
  }


  function downSort(A) {
    var n = A.length;
    for (var i = 0; i < n-1; i++) {
     for (var j = 0; j < n-1-i; j++) {
       if (A[j+1].xC > A[j].xC || A[j+1].xC === A[j].xC && A[j+1].followers.length > A[j].followers.length) {
         var t = A[j+1]; A[j+1] = A[j]; A[j] = t;
         delete A[j+1].xC;
       }
      }
      delete A[i].xC;
    }
    return A;
  }

};
