(function (angular) {

  'use strict';

  angular
    .module('$createUser', [])
    .service('$createUser', createUser);

  function createUser($timeout, Role, UserModel, Upload, config, serverHost) {
    var init = function(params) {

      var newUser = params.user;
      newUser.gender && (params.user.gender = parseInt(newUser.gender));

      //
      if (params.photoFile) {
        // PREPARE FOR UPLOAD PHOTO
        newUser.useValidation = true;
        UserModel.create(newUser,
          function(user) { console.warn('incorrect state'); },
          function(err) {
            // PREVENT MODEL VALIDATION BEFORE UPLOAD IMAGE
            if (err.data.error.message === 'complete') {
              delete newUser.useValidation;
              uploadFile();
              return;
            }

            pushErrors(err, params);
          });
      } else {
        // CREATE USER
        reCreateUser();
      }
      //

      // SUPPORT FNCs
      function uploadFile() {
        Upload.upload({
          url: serverHost + config.paths.upload.user,
          file: params.photoFile
        }).progress(function(evt) {
          //
          params.uploadProgress.pt = parseInt(100.0 * evt.loaded / evt.total);
        }).success(function(reply, status, headers, config) {
          //
          reCreateUser(reply.data ? reply.data.file[0]: null);
        }).error(function (reply, status, headers) {
          //
          params.errors.photoUpload = 'Unexpected error: file upload is failed';
        });
      }

      function reCreateUser(imageInfo) {
        if (imageInfo) {
          newUser.photo = '/Containers/' + imageInfo.container + '/download/' + imageInfo.name;
        }

        UserModel.create(newUser, function(user) {
          //Role.create
          Role.findOne({filter: {where: {name: params.userType || 'user'}}}, function(role) {
            Role.principals.create(
              {id: role.id},
              {
                principalType: 'USER',
                principalId: user.id
              }, function(responce) {
                getInfoNewUser(user);
                params.onComplete.text = 'User by ID:' + user.id + ' has been added';
                params.onComplete.cb = function() { params.$modalInstance.close(); };
                $timeout(function() { params.onComplete.success = true; }, params.onComplete.duration);
              }
            );
          });
        }, function (err) {
          pushErrors(err, params);
        });
      }

      function getInfoNewUser(user) {
        params.tableParams.reload();
      }
      //
    };

    return init;
  }


  var pushErrors = function (err, params) {
    var errorsMessages = err.data && err.data.error && err.data.error.details && err.data.error.details.messages;

    if (errorsMessages) {
      for (var pName in errorsMessages) {
        if (errorsMessages.hasOwnProperty(pName) && params.errors.any.indexOf(errorsMessages[pName][0]) === -1) {
          params.errors.any.push(errorsMessages[pName][0]);
        }
      }
    }
  }

})(angular);
