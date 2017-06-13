(function(angular) {
  'use strict';

  angular
    .module('application.modalAddBrandCtrl', [])
    .controller('ModalAddBrandCtrl', ModalAddBrandCtrl);


  function ModalAddBrandCtrl($modalInstance, $validationRules, $createBrand, $saveAfterEditBrand, config, serverHost, Subcategory, Brand, tableParams, brand) {
    var vm = this,
        editMode = false;

    /*
    // IF "brand" exists = EDIT MODE
    */
    if (brand) {
      editMode = true;
    }

    // PARAMS
    vm.title = 'Add Brand';
    vm.config = config;
    vm.config.brandPattern = '.' + config.validation.brand.photo.types.join(",.");
    vm.validators = $validationRules;
    vm.catSubcatList = [];
    vm.brandTitle = null;
    vm.uploadedPhoto = null;
    vm.currentSubcategory = null;
    vm.brandText = null;
    vm.uploadError = {};
    vm.uploadProgress = {};
    vm.onComplete = {
      duration: 0,
      success: false,
      cb: null
    };
    vm.errors = {
      photo: [],
      subcategory: [],
      any: []
    };

    //
    Subcategory.find({filter: {include: 'category'}}, function(subcategories) {
      var categories = {};

      subcategories.forEach(function(subcategory) {
        if (!categories.hasOwnProperty(subcategory.category.title)) {
          categories[subcategory.category.title] = [];
        }

        // PRESET FOR EDIT BRAND
        if (editMode && brand.subcategoryId === subcategory.id) {
          subcategory.statusActive = true;
          vm.currentSubcategory = subcategory;
        }
        //
        categories[subcategory.category.title].push(subcategory);
      });

      vm.subcategories = subcategories;
      vm.catSubcatList = categories;
    });

    // UPLOAD PHOTO VALIDATION
    vm.uploadPhoto = function(file, invalidFiles) {
      vm.errors.any = [];
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
        vm.uploadedPhoto = file;
        vm.onComplete.duration = 1200;
      }
    };

    // SELECT SUBCATEGORY
    vm.setSubcategory = function(currentSubcategory) {
      vm.errors.any = [];
      vm.errors.subcategory = [];
      vm.currentSubcategory = currentSubcategory;

      vm.subcategories.forEach(function(subcategory) {
        if (subcategory.id === currentSubcategory.id) {
          subcategory.statusActive = true;
        } else if (subcategory.statusActive) {
          subcategory.statusActive = false;
        }
      });
    };

    // SUBMIT
    vm.submit = function () {
      if (vm.brandTitle && vm.currentSubcategory) {
        var preParams = {
          title: vm.brandTitle,
          text: vm.brandText || '',
          imageData: vm.uploadedPhoto ? vm.uploadedPhoto : null,
          uploadProgress: vm.uploadProgress,
          subcategory: vm.currentSubcategory,
          uploadError: vm.uploadError,
          errors: vm.errors,
          onComplete: vm.onComplete,
          $modalInstance: $modalInstance
        };
        if (!editMode) {
          // CREATE
          preParams.tableParams = tableParams;
          $createBrand(preParams);
        } else {
          // PREPARE FOR EDIT & SAVE
          preParams.brand = brand;
          $saveAfterEditBrand(preParams);
        }

      } else {
        // ERRORS
        if (!vm.currentSubcategory && !vm.errors.subcategory.length) {
          vm.errors.subcategory.push('Please set subcategory');
        }
        if (!vm.errors.any.length) {
          vm.errors.any.push('Please fill out all fields');
        }
      }
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };

    // PRESET FOR EDIT
    if (editMode) {
      vm.title = 'Edit Brand';
      vm.brandTitle = brand.title;
      vm.brandText = brand.text;
      vm.uploadedPhoto = {
        $ngfBlobUrl: brand.image && brand.image.indexOf('http') === -1 ? serverHost + config.restApiRoot + brand.image : brand.image
      };
    }
  }

})(angular);
