(function (angular) {

  'use strict';

  angular
    .module('$saveAfterEditBrand', [])
    .service('$saveAfterEditBrand', saveAfterEditBrand);

  function saveAfterEditBrand($timeout, Upload, config, serverHost, Container) {
    var init = function(params) {
      var imageParts;

      if (params.brand.image) {
        imageParts = params.brand.image.split('/');
      }

      // NEW IMAGE
      if (imageParts && !!params.imageData.size) {
        Container.removeFile({
          container: 'brands',
          file: imageParts[imageParts.length - 1]
        }, function(responce) {
          uploadFile()
        }, function(err) {
          params.errors.any.push(err.data.error.message);
          uploadFile();
        });
      } else if (!!params.imageData.size) {
        uploadFile();
      } else {
        changeBrand();
      }

      function changeBrand() {
        var brandCopy = angular.copy(params.brand);

        delete params.brand.user;
        delete params.brand.category;
        delete params.brand.subcategory;
        params.brand.title = params.title;
        params.brand.text = params.text;
        params.brand.categoryId = params.subcategory.parentId;
        params.brand.subcategoryId = params.subcategory.id;

        params.brand.$save(function(instance) {
          instance.user = brandCopy.user;
          instance.category = brandCopy.category;
          instance.subcategory = brandCopy.subcategory;

          params.onComplete.text = 'Brand by ID:' + params.brand.id + ' has been changed';
          params.onComplete.cb = function() { params.$modalInstance.close(); };
          $timeout(function() { params.onComplete.success = true; }, params.onComplete.duration);
        });
      }

      function uploadFile() {
        Upload.upload({
          url: serverHost + config.paths.upload.brand,
          file: params.imageData
        }).progress(function(evt) {
          //
          params.uploadProgress.pt = parseInt(100.0 * evt.loaded / evt.total);
        }).success(function(reply, status, headers, config) {
          //
          params.brand.image = '/Containers/' + reply.data.file[0].container + '/download/' + reply.data.file[0].name;
          changeBrand();
        }).error(function (reply, status, headers) {
          //
          params.uploadError.msg = 'Unexpected error: file upload is failed';
        });
      }
      //
    };

    return init;
  }

})(angular);
