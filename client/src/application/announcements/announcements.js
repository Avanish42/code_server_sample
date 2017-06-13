(function(angular) {
  'use strict';

  angular
    .module('application.announcements', [])
    .config(config);

  function config($stateProvider) {
    $stateProvider
      .state('application.announcements', {
        url: 'announcements',
        templateUrl: 'application/announcements/announcements.html',
        accessRoles: ['administrator'],
        controllerAs: 'announcementsCtrl',
        controller: 'AnnouncementsCtrl'
      });
  }

})(angular);
