(function (angular) {
  'use strict';

  angular
    .module('application.resetPasswordRequest', [])
    .config(config);

  function config($stateProvider) {

    $stateProvider
      .state('application.resetPasswordRequest', {
        url: "reset-password-request",
        templateUrl: "application/reset-password-request/resetPasswordRequest.html"
      });
  }

})(angular);
