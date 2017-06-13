(function (angular) {
  'use strict';

  angular
    .module('application.resetPassword', [])
    .config(config);

  function config($stateProvider) {

    $stateProvider
      .state('application.resetPassword', {
        url: "reset-password?access_token",
        templateUrl: "application/reset-password/resetPassword.html",
        controllerAs: 'resetPasswordCtrl',
        controller: function($state) {
          var vm = this;
          vm.accessToken = $state.params['access_token'];
        }
      });
  }

})(angular);
