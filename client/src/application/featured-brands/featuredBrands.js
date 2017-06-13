(function(angular) {
  'use strict';

  angular
    .module('application.featuredBrands', [])
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('application.featuredBrands', {
        url: 'featured-brands',
        templateUrl: 'application/featured-brands/featuredBrands.html',
        accessRoles: ['administrator'],
        controllerAs: 'featuredBrandsCtrl',
        controller: FeaturedBrandsCtrl
      });
  }

  function FeaturedBrandsCtrl() {

  }

})(angular);
