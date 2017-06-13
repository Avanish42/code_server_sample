(function(angular) {
  'use strict';

  angular
    .module('application.modalRejectBrandCtrl', [])
    .controller('ModalRejectBrandCtrl', ModalRejectBrandCtrl);


  function ModalRejectBrandCtrl($modalInstance, Notification, Brand, brand) {
    var vm = this;

    vm.title = 'Reason';
    vm.brandExists = true;
    vm.searchDelay = 700;
    vm.brandReason = {};

    // SET BRAND REASON
    vm.setBrand = function(item, $e) {
      var linkEl = angular.element($e.target),
          list = angular.element($e.target.closest(".matches-list"));

      list.find('a').removeClass('active');
      linkEl.addClass('active');

      vm.brandReason = {
        id: item.id,
        title: item.title
      };
    };

    // REJECT
    vm.reject = function () {
      if (vm.brandExists && !vm.brandReason.id) {
        return Notification.error('Brand is not selected!');
      }

      var brandCopy = angular.copy(brand);

      brand.state = 'rejected';

      if (vm.brandExists) {
        brand.rejectReason = 'The brand already exists in the system (name: ' + vm.brandReason.title + ', id: ' + vm.brandReason.id + ')';
      } else {
        brand.rejectReason = 'The brand doesn`t exists';
      }

      Brand.prototype$updateAttributes({id: brand.id}, {state: brand.state, rejectReason: brand.rejectReason},
        function(response) {
          // Set relative temp data
          response.user = brandCopy.user;
          response.category = brandCopy.category;
          response.subcategory = brandCopy.subcategory;

          $modalInstance.close();
        },
        function(err) {
          alert(err.data.error.message);
          $modalInstance.close();
        }
      );
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };

    // SUPPORT FNCs
    vm.searchMatches = function(brandTitle) {
      var pattern = brandTitle.replace(/\s/g, '|') + '/i',
        reqParams = {filter: {
          where: {
            title: {regexp: pattern},
            id: {
              neq: brand.id
            },
            state: {
              inq: ['added_by_admin', 'accepted']
            }
          }}
        };

      vm.brandReason.id = null;

      Brand.find(reqParams, function(brandMatches) {
        vm.brandMatches = brandMatches;
      });
    };
  }

})(angular);
