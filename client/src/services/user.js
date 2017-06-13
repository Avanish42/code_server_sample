(function (angular) {

  'use strict';

  angular
    .module('$user', [])
    .service('$user', user);

  function user($q, LoopBackAuth, UserModel, $userInfo) {
    var that = this;

    this.login = function (credentials) {
      var deferred = $q.defer();

      UserModel.login(credentials,
        function (res) {
          deferred.resolve(res);
        }, function (res) {
          deferred.reject(res.data);
        });

      return deferred.promise;
    };

    this.logout = function () {
      $userInfo.clearUserInfo();
      LoopBackAuth.clearUser();
      LoopBackAuth.clearStorage();
    };

    this.isLogin = function () {
      return UserModel.isAuthenticated();
    };

    this.register = function(credentials, principalType) {
      var deferred = $q.defer();

      UserModel.create(credentials,
        function(res) {
          that.roleCreate({
              principalId: res.id,
              principalType: principalType
            })
            .then(function() {
              deferred.resolve(res);
            });
        }, function(res) {
          deferred.reject(res);
        });

      return deferred.promise;
    };
  }

})(angular);
