(function(angular) {

  'use strict';

  angular
    .module('application.statusWall', [])
    .directive('statusWall', statusWall);

  function statusWall() {
    return {
      replace: true,
      restrict: 'E',
      scope: {
        type: '=',
        text: '=',
        cb: '=',
        duration: '='
      },
      templateUrl: 'directives/status-wall/statusWall.html',
      bindToController: true,
      controller: StatusWallCtrl,
      controllerAs: 'statusWallCtrl'
    }
  }

  function StatusWallCtrl($timeout) {
    var vm = this;

    vm.cb && $timeout(vm.cb, vm.duration || 0);
  }

})(angular);
