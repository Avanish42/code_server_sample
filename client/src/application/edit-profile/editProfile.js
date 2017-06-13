(function (angular) {
  'use strict';

  angular
    .module('application.editProfile', [])
    .config(config);

  function config($stateProvider) {

    $stateProvider
      .state('application.editProfile', {
        url: "edit-profile",
        templateUrl: "application/edit-profile/editProfile.html",
        accessRoles: ['administrator'],
        controllerAs: 'editProfileCtrl',
        controller: 'EditProfileCtrl'
      });
  }

})(angular);
