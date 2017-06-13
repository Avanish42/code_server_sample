(function (angular) {
  'use strict';

  angular
    .module('application.notFound', [])
    .config(config);

  function config($stateProvider) {

    $stateProvider
      .state('application.notFound', {
        url: "not-found",
        templateUrl: "application/not-found/notFound.html"
      });
  }

})(angular);
