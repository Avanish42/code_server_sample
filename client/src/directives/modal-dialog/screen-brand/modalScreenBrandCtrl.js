(function(angular) {
  'use strict';

  angular
    .module('application.modalScreenBrandCtrl', [])
    .controller('ModalScreenBrandCtrl', ModalScreenBrandCtrl);


  function ModalScreenBrandCtrl($modalInstance, $modal, $saveAfterEditBrand, config, Brand, Review, brand) {
    var vm = this;

    // PARAMS
    vm.title = 'About Brand';
    vm.config = config;
    vm.brand = angular.copy(brand);
    vm.onComplete = {
      duration: 0,
      success: false,
      cb: null
    };

    /*
    // PREPARE REVIEW for BRAND
    */
    Review.find({filter: {include: [
      {
        relation: 'user',
        scope: {
          fields: ['username']
        }
      }
    ], order: 'createdAt DESC', where: {id: {inq: vm.brand.reviews}}}}, function(reviews) {
      vm.brand.reviews = reviews;
    });

    /*
    // CHANGE REVIEW POSITION
    */
    vm.changePosition = function(review) {
      Review.prototype$updateAttributes({id: review.id}, {position: review.position},
        function(response) {},
        function(err) { alert(err.data.error.message); }
      );
    };

    /*
    // SET DEFAULT POSITIONS
    */
    vm.resetPositions = function() {
      Review.updateAll({where: {brandId: brand.id}}, {position: null},
        function(response) {
          vm.brand.reviews.forEach(function(review) {
            review.position = 0;
          });
        },
        function(err) {
          alert(err.data.error.message);
        }
      );
    };

    /*
    // EDIT BRAND
    */
    vm.editBrand = function() {
      $modalInstance.dismiss('cancel');
      $modal.open({
        templateUrl: 'directives/modal-dialog/add-brand/modalAddBrand.html',
        controllerAs: 'modalAddBrandCtrl',
        controller: 'ModalAddBrandCtrl',
        resolve: {
          brands: function() {
            return []
          },
          brand: function() {
            return brand
          }
        }
      });
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }

})(angular);
