(function (angular) {

  'use strict';

  angular.module('application.notificationSettings', ['ui-notification'])
    .config(function(NotificationProvider) {
      NotificationProvider.setOptions({
        delay: 6000,
        startTop: 10,
        startRight: 10,
        verticalSpacing: 20,
        horizontalSpacing: 20,
        positionX: 'right',
        positionY: 'bottom'
      });
    });

})(angular);
