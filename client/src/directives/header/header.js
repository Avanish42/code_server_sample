(function(angular) {

  'use strict';

  angular
    .module('application.header', [])
    .directive('headerDrv', headerDrv);

  function headerDrv() {
    return {
      replace: true,
      restrict: 'E',
      scope: {},
      templateUrl: 'directives/header/header.html',
      controller: HeaderCtrl,
      controllerAs: 'headerCtrl'
    }
  }

  function HeaderCtrl($rootScope, $state, $user) {
    var vm = this;

    vm.$rootScope = $rootScope;

    //
    vm.logout = function () {
      $user.logout();
      $state.go('application.signIn');
    };
  }

})(angular);
