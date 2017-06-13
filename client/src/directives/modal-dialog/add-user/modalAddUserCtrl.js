(function(angular) {
  'use strict';

  angular
    .module('application.modalAddUserCtrl', [])
    .controller('ModalAddUserCtrl', ModalAddUserCtrl);


  function ModalAddUserCtrl($modalInstance, $validationRules, $createUser, $saveAfterEditUser, config, moment, userParams, IncomeRange) {
    var vm = this,
        user = userParams.user,
        tableParams = userParams.tableParams;

    // PARAMS
    vm.title = 'Add User';
    vm.config = config;
    vm.validators = $validationRules;
    vm.user = vm.user ? vm.user : {address: {}};
    vm.temp = {
      password: null,
      dob: user && user.dob ? moment(user.dob).format('DD.MM.YYYY') : null,
      photo: null
    };
    vm.resetErrors = {};
    vm.uploadProgress = {};
    vm.errors = {
      password: null,
      photo: [],
      any: []
    };
    vm.onComplete = {
      duration: 0,
      success: false,
      cb: null
    };
    vm.datepicker = {
      dpOpened: false,
      format: 'dd.MM.yyyy',
      maxDate: moment(new Date()).format('DD.MM.YYYY'),
      options: {
        formatYear: 'yy',
        startingDay: 1
      }
    };
    vm.config.userPattern = '.' + config.validation.user.photo.types.join(",.");

    /*
     // IF "user" exists = EDIT MODE
     */
    vm.editMode = user !== 'undefined' && user !== null;

    // PRESET FOR EDIT
    if (vm.editMode) {
      vm.title = 'Edit User';
      vm.user = angular.copy(user);

      if (vm.user.incomeRange) {
        vm.temp.incomeRange = vm.user.incomeRange;
      }

      if (user.photo) {
        vm.temp.photo = {
          $ngfBlobUrl: user.photo
        };
      }
    }

    // INIT INCOMES
    function initIncomes(country) {
      var incomeCountry = !country ? (vm.user.address && vm.user.address.country ? vm.user.address.country : 'any') : country;
      IncomeRange.find({filter: {where: {country: incomeCountry}}}, function (incomeRanges) {
        if (incomeRanges && incomeRanges.length) {
          vm.incomeRanges = incomeRanges[0].ranges;
        } else if (!country) {
          initIncomes('any');
        }
      });
    }
    initIncomes();

    // CHANGE FIELD
    vm.changeField = function (value, fieldName) {
      if (fieldName === 'country') {
        if (vm.user.meta && vm.user.meta.deviceId && Object.keys(vm.user.settings.devices).length) {
          !vm.user.settings.devices[vm.user.meta.deviceId].address && (vm.user.settings.devices[vm.user.meta.deviceId].address = {});
          vm.user.settings.devices[vm.user.meta.deviceId].address.country = value;
        }
        vm.user.address[fieldName] = value;
        initIncomes();
      }
    };

    // DATEPICKER SHOW
    vm.openDatepicker = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      vm.datepicker.dpOpened = true
    };

    // PHOTO VALIDATION
    vm.choosePhoto = function(file, invalidFiles) {
      vm.errors.photo = [];

      if (invalidFiles && invalidFiles.length) {
        if (invalidFiles[0].$error === 'pattern') {
          vm.errors.photo.push('File format is not supported (only: ' + config.validation.brand.photo.types.join(",") + ')');
        }
        if (invalidFiles[0].$error === 'minWidth') {
          vm.errors.photo.push('Image height is less than required (' + config.validation.brand.photo.minWidth + 'px)');
        }
        if (invalidFiles[0].$error === 'minHeight') {
          vm.errors.photo.push('Image height is less than required (' + config.validation.brand.photo.minHeight + 'px)');
        }
        if (invalidFiles[0].$error === 'maxSize') {
          vm.errors.photo.push('Image size is exceeded (max: ' + config.validation.brand.photo.maxSize + ')');
        }
      } else if (file) {
        vm.temp.photo = file;
        vm.onComplete.duration = 1200;
      }
    };

    //
    vm.resetErrors.password = function() {
      delete vm.errors.password;
    };

    // SUBMIT
    vm.submit = function () {
      var hasErrors = false;
      //
      vm.errors.any = [];
      //
      if (vm.temp.password && vm.user.password && vm.temp.password !== vm.user.password) {
        vm.errors.password = 'Passwords not equal';
      }
      //
      if (vm.temp.password && vm.user.password && vm.user.password === vm.user.username) {
        vm.errors.password = 'Password may not match the username';
      }

      for (var pName in vm.errors) {
        if (vm.errors.hasOwnProperty(pName) && vm.errors[pName] && vm.errors[pName][0]) {
          hasErrors = true;
        }
      }

      //
      vm.user.dob = new Date(vm.temp.dob).getTime();
      var preParams = {
        tableParams: tableParams,
        photoFile: vm.temp.photo,
        uploadProgress: vm.uploadProgress,
        onComplete: vm.onComplete,
        $modalInstance: $modalInstance,
        errors: vm.errors
      };

      if (!hasErrors) {
        if (!vm.editMode) {
          // CREATE
          preParams.user = vm.user;
          $createUser(preParams);
        } else {
          // PREPARE FOR EDIT & SAVE
          preParams.userOriginal = user;
          preParams.userCopy = vm.user;
          $saveAfterEditUser(preParams);
        }
      }
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }

})(angular);
