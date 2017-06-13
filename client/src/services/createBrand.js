(function (angular) {

  'use strict';

  angular
    .module('$createBrand', [])
    .service('$createBrand', createBrand);

  function createBrand($rootScope, $timeout, Brand, Upload, config, serverHost) {
    var init = function(params) {
      var newBrand = {
        state: 'added_by_admin',
        authorId: $rootScope.userInfo.id,
        title: params.title,
        text: params.text,
        categoryId: params.subcategory.parentId,
        subcategoryId: params.subcategory.id
      };


      if (params.imageData) {
        newBrand.useValidation = true;

        Brand.create(newBrand,
          function(brand) { console.warn('incorrect state'); },
          function(err) {
            // PREVENT MODEL VALIDATION BEFORE UPLOAD IMAGE
            if (err.data.error.message === 'complete') {
              delete newBrand.useValidation;
              return uploadFile();
            }

            var errorsMessages = err.data && err.data.error && err.data.error.details && err.data.error.details.messages;

            if (errorsMessages) {
              for (var pName in errorsMessages) {
                if (errorsMessages.hasOwnProperty(pName) && params.errors.any.indexOf(errorsMessages[pName][0]) === -1) {
                  params.errors.any.push(errorsMessages[pName][0]);
                }
              }
            }
          });
      } else {
        reCreateBrand();
      }

      // SUPPORT FNCs
      function uploadFile() {
        Upload.upload({
          url: serverHost + config.paths.upload.brand,
          file: params.imageData
        }).progress(function(evt) {
          //
          params.uploadProgress.pt = parseInt(100.0 * evt.loaded / evt.total);
        }).success(function(reply, status, headers, config) {
          //
          reCreateBrand(reply.data ? reply.data.file[0]: null);
        }).error(function (reply, status, headers) {
          //
          params.uploadError.msg = 'Unexpected error: file upload is failed';
        });
      }

      function reCreateBrand(imageInfo) {
        if (imageInfo) {
          newBrand.image = '/Containers/' + imageInfo.container + '/download/' + imageInfo.name;
        }

        Brand._create({data: newBrand}, function(brand) {
          if (!brand || !Object.keys(brand).length) {
            return alert('Can`t create Brand');
          }

          getInfoNewBrand(brand);
          params.onComplete.text = 'Brand by ID:' + brand.id + ' has been added';
          params.onComplete.cb = function() { params.$modalInstance.close(); };
          $timeout(function() { params.onComplete.success = true; }, params.onComplete.duration);
        }, function (err) {
          var errorsMessages = err.data && err.data.error && err.data.error.details && err.data.error.details.messages;

          if (errorsMessages) {
            for (var pName in errorsMessages) {
              if (errorsMessages.hasOwnProperty(pName) && params.errors.any.indexOf(errorsMessages[pName][0]) === -1) {
                params.errors.any.push(errorsMessages[pName][0]);
              }
            }
          }
        });
      }

      function getInfoNewBrand(brand) {
        Brand.findOne({filter: {where: {id: brand.id}, include: [{
          relation: 'user',
          scope: {
            fields: ['username']
          }
        }, {
          relation: 'category',
          scope: {
            fields: ['title']
          }
        }, {
          relation: 'subcategory',
          scope: {
            fields: ['title']
          }
        }]}}, function(response) {
          params.tableParams.reload();
        });
      }
      //
    };

    return init;
  }

})(angular);
