(function (angular) {
  'use strict';

  angular
    .module('application.signIn', [])
    .config(config);

  function config($stateProvider) {

    $stateProvider
      .state('application.signIn', {
        url: "sign-in",
        templateUrl: "application/sign-in/signIn.html"
      });
  }

})(angular);
