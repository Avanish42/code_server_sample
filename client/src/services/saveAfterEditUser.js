(function (angular) {

  'use strict';

  angular
    .module('$saveAfterEditUser', [])
    .service('$saveAfterEditUser', saveAfterEditUser);

  function saveAfterEditUser($timeout, Upload, UserModel, config, serverHost, Container) {
    var init = function(params) {

      // NEW IMAGE
      if (params.photoFile && params.photoFile.size) {
        if (params.userOriginal.photo) {
          var imageParts = params.userOriginal.photo.split('/');

          Container.removeFile({
            container: 'users',
            file: imageParts[imageParts.length - 1]
          }, function(response) {
            uploadFile()
          }, function(err) {
            params.errors.any.push(err.data.error.message);
            uploadFile();
          });
        } else {
          uploadFile();
        }
      } else {
        changeUser();
      }

      function changeUser() {
        var params4Update = params.userCopy;
        params.userCopy.gender && (params4Update.gender = parseInt(params.userCopy.gender));

        //
        UserModel.prototype$updateAttributes({id: params.userCopy.id}, params4Update,
          function(instance) {
            params.onComplete.text = 'User by ID:' + instance.id + ' has been changed';
            params.onComplete.cb = function() { params.$modalInstance.close(); };
            $timeout(function() { params.onComplete.success = true; }, params.onComplete.duration);

            for (var pName in params4Update) {
              if (params4Update.hasOwnProperty(pName)) {
                if (pName === 'photo') {
                  if (params4Update[pName] && params4Update[pName].indexOf('http') === -1) {
                    params.userOriginal[pName] = serverHost + config.restApiRoot + params4Update[pName];
                  }
                } else {
                  params.userOriginal[pName] = params4Update[pName];
                }
              }
            }
          },
          function(err) {
            params.errors.any.push(err.data.error.message);
          }
        );
      }

      function uploadFile() {
        Upload.upload({
          url: serverHost + config.paths.upload.user,
          file: params.photoFile
        }).progress(function(evt) {
          //
          params.uploadProgress.pt = parseInt(100.0 * evt.loaded / evt.total);
        }).success(function(reply, status, headers, config) {
          //
          params.userCopy.photo = '/Containers/' + reply.data.file[0].container + '/download/' + reply.data.file[0].name;
          changeUser();
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
