(function(angular) {
  'use strict';

  angular
    .module('application.modalImportBrandsCtrl', [])
    .controller('ModalImportBrandsCtrl', ModalImportBrandsCtrl);


  function ModalImportBrandsCtrl($scope, $modalInstance, $importBrands, BrandsByCountries, config, externalParams) {
    var vm = this;

    // PARAMS
    vm.title = 'Import Brands';
    vm.list = externalParams.list;
    vm.config = config;
    vm.config.brandPattern = '.' + config.validation.brand.import.types.join(",.");
    vm.temp = {
      rewriteImages: false,
      importFile: null
    };
    vm.importProgress = {pt: 0};
    vm.errors = {
      upload: [],
      import: []
    };
    vm.messages = [];

    // UPLOAD FILE
    vm.uploadFile = function(file, invalidFiles) {
      if (invalidFiles && invalidFiles.length) {
        vm.temp.importFile = null;
        vm.importProgress.pt = 100;
        vm.errors.upload = invalidFiles.map(function(item) {
          return 'Incorrect format for file' + item.name + ' (use ' + item.$errorParam + ')'
        });
      } else if (file) {
        // RESET MSGS
        vm.importProgress.pt = 0;
        vm.errors.upload = [];
        vm.errors.import = [];
        vm.messages = [];
        vm.temp.importFile = file;
      }
    };

    // SUBMIT
    vm.submit = function () {
      // RESET MSGS
      vm.importProgress.pt = 0;
      vm.errors.upload = [];
      vm.errors.import = [];
      vm.messages = [];

      var callback = function(newList) {
        // UPDATE LIST
        BrandsByCountries.findOne({filter: {where: {id: externalParams.list.id}}}, function(bbc) {
          externalParams.callback(bbc);
        });
      };

      var reqParams = {
        list: externalParams.list,
        fileData: vm.temp.importFile,
        importProgress: vm.importProgress,
        rewriteImages: vm.temp.rewriteImages,
        errors: vm.errors,
        messages: vm.messages,
        $scope: $scope,
        cb: callback
      };

      $importBrands(reqParams);
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }


})(angular);
