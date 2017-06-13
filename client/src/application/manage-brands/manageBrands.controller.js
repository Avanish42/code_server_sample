(function(angular) {
  'use strict';

  angular
    .module('application.manageBrandsCtrl', [])
    .controller('ManageBrandsCtrl', ManageBrandsCtrl);


  function ManageBrandsCtrl($modal, $helpers, Brand, config, $filterManage, NgTableParams) {
    var vm = this,
        filterBy = {
          categoryId: undefined,
          subcategoryId: undefined,
          status: undefined,
          state: undefined,
          query: undefined
        };

    vm.config = config;
    vm.filter = $filterManage.init(['category', 'subcategory', 'state']);
    vm.helpers = $helpers;
    vm.orderBy = {createdAt: 'desc'};

    /* Prepare Brands */
    vm.getTableTotal = function (params) {
      var reqParams = {};

      if (params && Object.keys(params).length) {
        reqParams.where = params;
      }

      Brand.count(reqParams, function(info) {
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
              include: [{
                relation: 'user',
                scope: {
                  fields: ['username', 'email']
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
              }],
              limit: count,
              skip: (page - 1 || 0) * count
            };

          if (sorting && Object.keys(sorting).length) {
            reqParams.order = Object.keys(sorting)[0] + ' ' + sorting[Object.keys(sorting)[0]].toUpperCase();
          }

          Brand.find({filter: reqParams}, function(brands) {
            $defer.resolve(brands);
          });
        }
      }
    );

    // DYNAMIC CHANGE TABLE CONTENT
    vm.setTableFilter = function(by, value) {
      vm.filter.change(by, value, filterBy).then(function (response) {
        vm.getTableTotal(response);
        vm.tableParams.reload();
      });
    };

    // TOGGLE TEXT
    vm.toggleText = function($e) {
      var target = angular.element($e.target);

      target.toggleClass('glyphicon-plus glyphicon-minus');
      target.parent().toggleClass('show-text');
    };

    // NEW BRAND
    vm.addBrand = function() {
      $modal.open({
        templateUrl: 'directives/modal-dialog/add-brand/modalAddBrand.html',
        controllerAs: 'modalAddBrandCtrl',
        controller: 'ModalAddBrandCtrl',
        resolve: {
          tableParams: function() {
            return vm.tableParams
          },
          brand: function() {
            return null
          }
        }
      });
    };

    // SCREEN
    vm.screenBrand = function(brand) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/screen-brand/modalScreenBrand.html',
        controllerAs: 'modalScreenBrandCtrl',
        controller: 'ModalScreenBrandCtrl',
        resolve: {
          brand: function() {
            return brand
          }
        }
      });
    };

    // DELETE
    vm.brandDelete = function(brandId) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/confirmation/modalConfirmation.html',
        size: 'sm',
        controllerAs: 'modalConfirmationCtrl',
        controller: ModalConfirmationDeleteCtrl,
        resolve: {
          brandParams: function () {
            return {
              tableParams: vm.tableParams,
              id: brandId
            };
          }
        }
      });
    };

    // EDIT BRAND
    vm.brandEdit = function(brand) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/add-brand/modalAddBrand.html',
        controllerAs: 'modalAddBrandCtrl',
        controller: 'ModalAddBrandCtrl',
        resolve: {
          tableParams: function() {
            return vm.tableParams
          },
          brand: function() {
            return brand
          }
        }
      });
    };

    // APPROVE / DISAPPROVE
    vm.changeState = function(brand, type) {
      if (brand.state === type) {
        return;
      }

      if (type === 'rejected') {
        $modal.open({
          templateUrl: 'directives/modal-dialog/reject-brand/modalRejectBrand.html',
          size: 'sm',
          controllerAs: 'modalRejectBrandCtrl',
          controller: 'ModalRejectBrandCtrl',
          resolve: {
            brand: function() {
              return brand
            }
          }
        });
      } else {
        var brandCopy = angular.copy(brand);
        brand.state = type;

        Brand.prototype$updateAttributes({id: brand.id}, {state: brand.state},
          function(response) {
            response.user = brandCopy.user;
            response.category = brandCopy.category;
            response.subcategory = brandCopy.subcategory;
          },
          function(err) {
            alert(err.data.error.message);
          }
        );
      }
    };
  }


  /*
  // DELETE BRAND
  */
  function ModalConfirmationDeleteCtrl(Brand, $modalInstance, brandParams) {
    var vm = this;

    vm.title = 'Confirmation';
    vm.context = 'Are you sure want to DELETE the Brand by ID: "' + brandParams.id + '"?';

    //
    vm.ok = function() {
      Brand._delete({brandId: brandParams.id}, function(err, info) {
        brandParams.tableParams.reload();
        $modalInstance.close();
      });
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }

})(angular);
