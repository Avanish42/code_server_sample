(function(angular) {

  'use strict';

  angular
    .module('application.suggestedBrands', [])
    .directive('suggestedBrands', suggestedBrands);

  function suggestedBrands() {
    return {
      replace: true,
      restrict: 'E',
      scope: {},
      templateUrl: 'directives/suggested-brands/suggestedBrands.html',
      bindToController: true,
      controller: 'SuggestedBrandsCtrl',
      controllerAs: 'suggestedBrandsCtrl'
    }
  }

})(angular);
