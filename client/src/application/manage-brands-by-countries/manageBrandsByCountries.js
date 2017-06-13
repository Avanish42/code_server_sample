(function (angular) {
  'use strict';

  angular
    .module('application.manageBrandsByCountries', [])
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('application.manageBrandsByCountries', {
        url: 'manage-brands-countries',
        templateUrl: 'application/manage-brands-by-countries/manageBrandsByCountries.html',
        accessRoles: ['administrator'],
        controllerAs: 'manageBrandsByCountriesCtrl',
        controller: 'ManageBrandsByCountriesCtrl'
      });
  }

})(angular);
