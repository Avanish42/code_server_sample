(function(angular) {
  'use strict';

  angular
    .module('application.manageBrandsByCountriesCtrl', [])
    .controller('ManageBrandsByCountriesCtrl', ManageBrandsCtrl);


  function ManageBrandsCtrl(Brand, $modal, $scope, BrandsByCountries) {
    var vm = this;

    //
    vm.lists = [];
    vm.temp = {};

    // PREPARE LISTS
    BrandsByCountries.find({}, function(bbcs) {
      vm.lists = bbcs;
    });

    //
    function addListCallback(newList) {
      vm.lists = vm.lists.concat(newList);
    }

    //
    function deleteListCallback(removedList) {
      vm.lists = vm.lists.filter(function(list) {
        return list.id !== removedList.id;
      });
    }

    // NEW LIST
    vm.addList = function() {
      $modal.open({
        templateUrl: 'directives/modal-dialog/add-bc/modalAddBByC.html',
        controllerAs: 'modalAddBByCCtrl',
        controller: 'ModalAddBByCCtrl',
        resolve: {
          modalParams: function () {
            var usedCountries = [];
            vm.lists.forEach(function(item) { usedCountries = usedCountries.concat(item.countries) });

            return {
              type: 'add',
              usedCountries: usedCountries,
              errors: vm.errors,
              callback: addListCallback
            };
          }
        }
      });
    };

    // IMPORT LIST
    vm.importBrands = function(list) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/import-brands/modalImportBrands.html',
        //size: 'sm',
        controllerAs: 'modalImportBrandsCtrl',
        controller: 'ModalImportBrandsCtrl',
        resolve: {
          externalParams: function() {
            return {
              list: list,
              callback: function(newList) {
                vm.lists = vm.lists.map(function(item) {
                  if (item.id === newList.id) {
                    item = newList;
                  }
                  return item;
                });
              }
            }
          }
        }
      });
    };

    // DELETE LIST
    vm.deleteList = function(list, $event) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/confirmation/modalConfirmation.html',
        size: 'sm',
        controllerAs: 'modalConfirmationCtrl',
        controller: ModalConfirmationDeleteCtrl,
        resolve: {
          listParams: function () {
            return {
              list: list,
              $event: $event
            };
          },
          lists: function () {
            return vm.lists
          },
          callback: function() {
            return deleteListCallback
          }
        }
      });
    };

    // EDIT LIST
    vm.listEdit = function(list, $event) {
      console.warn('brands in list: ', list.brands.length);

      $modal.open({
        templateUrl: 'directives/modal-dialog/add-bc/modalAddBByC.html',
        controllerAs: 'modalAddBByCCtrl',
        controller: 'ModalAddBByCCtrl',
        resolve: {
          modalParams: function () {
            var usedCountries = [];
            vm.lists.forEach(function(item) { usedCountries = usedCountries.concat(item.countries) });

            return {
              type: 'edit',
              list: list,
              $event: $event,
              usedCountries: usedCountries
            };
          }
        }
      });
    };
  }


  /*
   // MODAL: DELETE LIST
   */
  function ModalConfirmationDeleteCtrl(BrandsByCountries, $modalInstance, $helpers, listParams, lists, callback) {
    var vm = this;

    vm.title = 'Confirmation';
    vm.context = 'Are you sure want to DELETE the List by title: "' + listParams.list.title + '"?';

    //
    vm.ok = function() {
      var htmlEl = angular.element(listParams.$event.target.closest('.c-list'));

      BrandsByCountries._delete({where: {id: listParams.list.id}},
        function(info) {
          htmlEl.remove();

          lists = lists.filter(function(list) {
            return String(list.id) !== String(listParams.list.id);
          });
          lists.forEach(function(list) {
            if (String(list.id) === String(listParams.list.id)) {
              list.brands = [];
              list.countries = [];
            }
          });

          callback({id: listParams.list.id});
          $modalInstance.close();
        },
        function(err) {
          var cb = function() { alert(err.data.error.message); };
          $helpers.handlerResponseError(err, cb);
        }
      );
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }


})(angular);
