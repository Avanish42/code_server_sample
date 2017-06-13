(function (angular) {

  'use strict';

  angular
    .module('application.resetPasswordRequestForm', [])
    .directive('resetPasswordRequestForm', resetPasswordRequestForm);

  function resetPasswordRequestForm() {
    return {
      replace: true,
      restrict: 'E',
      scope: {},
      templateUrl: 'directives/reset-password-request-form/resetPasswordRequestForm.html',
      controllerAs: 'resetPasswordRequestForm',
      controller: ResetPasswordRequestForm
    }
  }

  function ResetPasswordRequestForm(config, $validationRules, UserModel) {
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
      UserModel._resetPasswordRequest({email: vm.email},
        function(status) {
          vm.success = 'Check your email'
        },
        function(err) {
          if (err.data && err.data.error && err.data.error.message) {
            vm.error = err.data.error.message;
          } else {
            vm.error = 'Process request password was failed';
          }
        }
      );

      vm.hasSubmit = true;
      vm.email = null;
    };
  }

})(angular);
