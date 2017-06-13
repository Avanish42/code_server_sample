(function(angular) {
  'use strict';

  angular
    .module('application.manageUsersCtrl', [])
    .controller('ManageUsersCtrl', ManageUsersCtrl);


  function ManageUsersCtrl($modal, $helpers, $filterManage, UserModel, config, NgTableParams) {
    var vm = this,
        filterBy = {
          status: undefined,
          query: undefined
        };

    vm.filter = $filterManage.init();
    vm.config = config;
    vm.helpers = $helpers;
    vm.filterByActive = {};
    vm.orderBy = {createdAt: 'desc'};

    /* Prepare Users */
    vm.getTableTotal = function (params) {
      var reqParams = {};

      if (params && Object.keys(params).length) {
        reqParams.where = params;
      }

      UserModel.count(reqParams, function(info) {
        vm.tableParams.total(info.count);
      });
    };

    vm.getTableTotal();
    vm.tableParams = new NgTableParams(
      {
        page: 1,
        count: 5
      },
      {
        total: 0,
        counts: [5, 10, 25, 50],
        getData: function ($defer, params) {
          var sorting = params.sorting() && Object.keys(params.sorting()).length ? params.sorting() : vm.orderBy,
              count = params.count(),
              page = params.page(),

            reqParams = {
              where: filterBy,
              limit: count,
              skip: (page - 1 || 0) * count
            };

          if (sorting && Object.keys(sorting).length) {
            reqParams.order = Object.keys(sorting)[0] + ' ' + sorting[Object.keys(sorting)[0]].toUpperCase();
          }

          UserModel.find({filter: reqParams}, function(users) {
            $defer.resolve(users);
          });
        }
      }
    );

    // DYNAMIC CHANGE TABLE CONTENT
    vm.setTableFilter = function(by, value) {
      vm.filter.change(by, value, filterBy);
      vm.getTableTotal(filterBy);
      vm.tableParams.reload();
    };

    // CHANGE STATUS
    vm.changeStatus = function(user) {
      user.status = user.status ? 1 : 0;
      UserModel.prototype$updateAttributes({id: user.id}, {status: user.status},
        function(response) {},
        function(err) {
          alert(err.data.error.message);
        }
      );
    };

    // NEW USER
    vm.addUser = function() {
      $modal.open({
        templateUrl: 'directives/modal-dialog/add-user/modalAddUser.html',
        controllerAs: 'modalAddUserCtrl',
        controller: 'ModalAddUserCtrl',
        resolve: {
          userParams: function() {
            return {
              tableParams: vm.tableParams,
              user: null
            }
          }
        }
      });
    };

    // DELETE
    vm.userDelete = function(userId) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/confirmation/modalConfirmation.html',
        size: 'sm',
        controllerAs: 'modalConfirmationCtrl',
        controller: ModalConfirmationDeleteCtrl,
        resolve: {
          userParams: function () {
            return {
              tableParams: vm.tableParams,
              id: userId
            };
          }
        }
      });
    };

    // EDIT
    vm.userEdit = function(user) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/add-user/modalAddUser.html',
        controllerAs: 'modalAddUserCtrl',
        controller: 'ModalAddUserCtrl',
        resolve: {
          userParams: function() {
            return {
              tableParams: vm.tableParams,
              user: user
            }
          }
        }
      });
    }
  }


  /*
  // DELETE USER
  */
  function ModalConfirmationDeleteCtrl($modalInstance, UserModel, userParams) {
    var vm = this;
    vm.title = 'Confirmation';
    vm.context = 'Are you sure want to DELETE the User by ID: "' + userParams.id + '"?';

    //
    vm.ok = function() {
      UserModel._deleteUserRelations({id: userParams.id}, function(info) {
        userParams.tableParams.reload();
        $modalInstance.close();
      });
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }

})(angular);
