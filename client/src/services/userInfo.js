(function (angular) {

  'use strict';

  angular
    .module('$userInfo', [])
    .service('$userInfo', userInfo);

  function userInfo($window, $q, UserModel) {
    var user;

    this.setUserInfo = function(userData) {
      var paramName;
      user = {};
      for (paramName in userData) {
        if (userData.hasOwnProperty(paramName)) {
          user[paramName] = userData[paramName];
        }
      }
    };

    this.getUserInfo = function() {
      var deferred = $q.defer();

      if (user) {
        deferred.resolve(user);
      } else {
        var userId = $window.localStorage.getItem('$LoopBack$currentUserId');

        if (userId) {
          UserModel.findOne({filter: {include: 'roles', where: {id: userId}, fields: ['id', 'username', 'email', 'firstName', 'lastName']}}, function (userRes) {
            if (userRes) {
              user = userRes;
              user.roles = userRes.roles.map(function(item) { return item.name; });
              deferred.resolve(user);
            } else {
              deferred.resolve(user);
            }
          }, function (res) {
            deferred.reject(res);
          });
        } else {
          deferred.resolve(user);
        }
      }

      return deferred.promise;
    };

    this.clearUserInfo = function() {
      user = null;
    }

  }

})(angular);
