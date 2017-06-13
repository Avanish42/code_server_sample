(function (angular) {

  'use strict';

  angular
    .module('application.resetPasswordForm', [])
    .directive('resetPasswordForm', resetPasswordForm);

  function resetPasswordForm() {
    return {
      replace: true,
      restrict: 'E',
      scope: {
        token: '='
      },
      bindToController: true,
      templateUrl: 'directives/reset-password-form/resetPasswordForm.html',
      controllerAs: 'resetPasswordForm',
      controller: ResetPasswordForm
    }
  }

  function ResetPasswordForm(config, $validationRules, UserModel) {
    var vm = this;

    vm.config = config;
    vm.validators = $validationRules;

    //
    vm.changeFields = function() {
      vm.hasSubmit = false;
      vm.error = null;
      vm.success = null;
    };

    //
    vm.submit = function() {
      if (vm.password !== vm.rePassword) {
        vm.error = 'Passwords not equal';
      } else if (!vm.token) {
        vm.error = 'Token field is null';
      } else {
        vm.error = null;
        requestSetPassword(vm.token, vm.password);
      }

      vm.hasSubmit = true;
      vm.password = null;
      vm.rePassword = null;
    };

    // Set request for new password
    var requestSetPassword = function(token, password) {
      UserModel._setPasswordByToken({token: token, password: password},
        function(user) {
          vm.success = 'Password has been changed';
        }, function(err) {
          if (err.data && err.data.error && err.data.error.message) {
            vm.error = err.data.error.message;
          } else {
            vm.error = 'Process change password was failed';
          }
        }
      );
    }
  }

})(angular);
