(function (angular) {
  'use strict';

  angular
    .module('application.manageBrands', [])
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('application.manageBrands', {
        url: 'manage-brands',
        templateUrl: 'application/manage-brands/manageBrands.html',
        accessRoles: ['administrator'],
        controllerAs: 'manageBrandsCtrl',
        controller: 'ManageBrandsCtrl'
      });
  }

})(angular);
