(function (angular) {
  'use strict';

  angular
    .module('application.unexpectedError', [])
    .config(config);

  function config($stateProvider) {

    $stateProvider
      .state('application.unexpectedError', {
        url: "unexpected-error",
        templateUrl: "application/unexpected-error/unexpectedError.html"
      });
  }

})(angular);
