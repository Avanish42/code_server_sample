(function(angular) {
  'use strict';

  angular
    .module('application.editProfileCtrl', [])
    .controller('EditProfileCtrl', EditProfileCtrl);


  function EditProfileCtrl(config, $validationRules, $userInfo, UserModel, Notification) {
    var vm = this,
        user;

    vm.config = config;
    vm.validators = $validationRules;
    vm.complete = false;
    vm.user = {};

    $userInfo.getUserInfo()
      .then(function(userInfo) {
        vm.user.id = userInfo.id;
        vm.user.email = userInfo.email;
      });

    vm.changeFields = function() {
      vm.complete = true;
    };

    vm.submit = function() {
      vm.complete = true;
      var user = {
        user: vm.user
      };

      UserModel._changeCredentials(user, function(response) {
        delete vm.user.password;
        Notification.success('User credentials has been changed');
      }, function(err) {
        var msg = 'Process of change user credentials was failed';
        delete vm.user.password;
        if (err && err.data && err.data.error && err.data.error.message) {
          msg = err.data.error.message;
        }
        Notification.error(msg);
      });
    };
  }

})(angular);
