(function (angular) {
  'use strict';

  angular
    .module('application.manageReviews', [])
    .config(config);


  function config($stateProvider) {
    $stateProvider
      .state('application.manageReviews', {
        url: 'manage-reviews',
        templateUrl: 'application/manage-reviews/manageReviews.html',
        accessRoles: ['administrator'],
        controllerAs: 'manageReviewsCtrl',
        controller: 'ManageReviewsCtrl'
      });
  }

})(angular);
