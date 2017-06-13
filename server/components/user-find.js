var Promise = require('promise'),
    filterParser = require('../modules/filter-parser'),
    CheckToken = require('../modules/check-token');

module.exports = function(app, options) {

  var User = app.models.UserModel,
      Brand = app.models.Brand;


  /*
   // GET
   */
  app.get(options.url, function(req, res) {
    var isValidToken = CheckToken(req, res);
    if (!isValidToken) return;

    var prepareDataPromise = new Promise(function (resolve, reject) {
      var reqParams = {
        where: {},
        fields: ['id', 'firstName', 'lastName', 'photo', 'address', 'reviews'],
        order: 'firstName ASC'
      };

      if (req.query && req.query.query) {
        var pattern = new RegExp('^' + req.query.query, 'i');
        reqParams.where = { or: [{firstName: pattern}, {lastName: pattern}] };
      } else {
        return res.json({
          code: 0,
          data: null
        });
      }

      if (req.query.filter) {
        reqParams.where = filterParser(req.query.filter);
      }

      req.accessToken.user(function (err, user) {
        if (err || !user) {
          res.status(404);
          res.json({
            code: '000-404',
            message: 'User not found',
            errors: []
          });

          return;
        }

        reqParams.where.id = {neq: String(user.id)};

        if (req.query.brand) {
          Brand.findOne({ where: {id: req.query.brand}, fields: ['id', 'reviews'] }, function (err, brand) {
            resolve({usersReqParams: reqParams, user: user, brand: brand});
          });
        } else {
          resolve({usersReqParams: reqParams, user: user});
        }
      });
    });

    //
    prepareDataPromise.then(function(params) {
      var user = params.user,
          usersReqParams = params.usersReqParams,
          brand = params.brand,
          limit = parseInt(req.query.pageSize) || 10,
          skip = (parseInt(req.query.page) - 1 || 0) * limit,
          users4Print = [];

      User.find(usersReqParams, function(err, users) {
        if (err || !users || !req.query.sortBy || req.query.sortBy !== 'onComment') {
          return res.json({
            code: 0,
            data: users
          });
        }

        var sortGroups = {0: [], 1: [], 2: [], 3: [], 4: [], 5: []},
            sortedUsers = [];

        users.forEach(function(item) {
          var itemId = String(item.id),
              useBrand = false;

          if (brand) {
            item.reviews.forEach(function(reviewId) {
              if (brand.reviews.indexOf(reviewId) !== -1) {
                useBrand = true;
              }
            });
          }

          if (user.following.indexOf(itemId) !== -1 && user.followers.indexOf(itemId) !== -1) {
            // CASE 1: GROUP 0
            sortGroups[0].push(item);
          } else if (user.following.indexOf(itemId) !== -1) {
            // CASE 2: GROUP 1
            sortGroups[1].push(item);
          } else if (user.followers.indexOf(itemId) !== -1) {
            // CASE 3: GROUP 2
            sortGroups[2].push(item);
          } else if (useBrand) {
            // CASE 4: GROUP 3
            sortGroups[3].push(item);
          } else if ((user.address.city && item.address.city) && (user.address.city === item.address.city)) {
            // CASE 5: GROUP 4
            sortGroups[4].push(item);
          } else {
            // CASE 6: GROUP 5
            sortGroups[5].push(item);
          }
        });

        Object.keys(sortGroups).forEach(function(groupLvl) {
          sortGroups[groupLvl].sort(function(a, b){
            if(a.firstName < b.firstName) return -1;
            if(a.firstName > b.firstName) return 1;
            return 0;
          });

          sortedUsers = sortedUsers.concat(sortGroups[groupLvl]);
        });

        // Echo Skip Users
        for (var i = skip; i <= skip + limit; i++) {
          if (!sortedUsers[i] || i > skip + limit - 1) {
            res.json({
              code: 0,
              data: users4Print
            });
            return;
          } else {
            users4Print.push(sortedUsers[i]);
          }
        }

        res.json({
          code: 0,
          data: users4Print
        });
      });
    });

  });

};
