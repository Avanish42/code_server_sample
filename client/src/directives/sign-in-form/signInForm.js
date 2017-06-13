(function (angular) {

  'use strict';

  angular
    .module('application.signInForm', [])
    .directive('signInForm', signInForm);

  function signInForm() {
    return {
      replace: true,
      restrict: 'E',
      scope: {},
      templateUrl: 'directives/sign-in-form/signInForm.html',
      controllerAs: 'signInFormCtrl',
      controller: SignInFormCtrl
    }
  }

  function SignInFormCtrl($state, $rootScope, $user, $userInfo, $validationRules, config) {
    var vm = this;

    vm.user = {};
    vm.config = config;
    vm.validators = $validationRules;

    //
    vm.changeFields = function() {
      delete vm.errorAuth;
    };

    //
    vm.submit = function(form) {
      $user.login(vm.user)
        .then(function(response) {
          vm.errorAuth = null;
          $userInfo.getUserInfo()
            .then(function(userInfo) {
              if (userInfo.roles.indexOf('administrator') !== -1) {
                $rootScope.userInfo = userInfo;
                $state.go('application.manageReviews');
              } else {
                $user.logout();
                $state.go('application.signIn');
                vm.errorAuth = 'You are not an administrator';
              }
            });
        })
        .catch(function(err) {
          vm.errorAuth = 'Incorrect username or password';
        });
    }
  }

})(angular);
