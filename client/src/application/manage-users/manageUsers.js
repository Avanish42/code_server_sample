(function (angular) {
  'use strict';

  angular
    .module('application.manageUsers', [])
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('application.manageUsers', {
        url: 'manage-users',
        templateUrl: 'application/manage-users/manageUsers.html',
        accessRoles: ['administrator'],
        controllerAs: 'manageUsersCtrl',
        controller: 'ManageUsersCtrl'
      });
  }

})(angular);
