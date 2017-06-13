(function(angular) {

  'use strict';

  angular
    .module('application.trendingBrands', [])
    .directive('trendingBrands', trendingBrands);

  function trendingBrands() {
    return {
      replace: true,
      restrict: 'E',
      scope: {},
      templateUrl: 'directives/trending-brands/trendingBrands.html',
      bindToController: true,
      controller: TrendingBrandsCtrl,
      controllerAs: 'trendingBrandsCtrl'
    }
  }

  function TrendingBrandsCtrl(Brand, config) {
    var vm = this,
        reqParams = {
          filter: {
            where: {},
            fields: ['id', 'title', 'image']
          }
        };

    vm.config = config;
    vm.temp = {};
    vm.hasChanges = false;

    /*
    // SHOW CURRENT BRAND
    */
    vm.showCurrentBrand = function() {
      reqParams.filter.where = {
        trendOne: true
      };
      Brand.find(reqParams, function(brands) {
        vm.currentBrand = brands[0];
      });
    };
    vm.showCurrentBrand();

    /*
    // SEARCH BRANDs
    */
    vm.searchBrand = function() {
      if (vm.temp.queryBrand) {
        var pattern = vm.temp.queryBrand + '/i';

        reqParams.filter.where = {
          title: {regexp: pattern}
        };

        Brand.find(reqParams, function(brands) {
          vm.foundBrands = brands;
          vm.openBrandList = true;
        });
      } else {
        vm.openBrandList = false;
      }
    };

    /*
    // FILLING BRANDS (EMPTY QUERY)
    */
    vm.fillSearchBrands = function(query) {
      if (!query) {
        reqParams.filter.where = {};

        Brand.find(reqParams, function(brands) {
          vm.foundBrands = brands;
          vm.openBrandList = true;
        });
      }
    };

    /*
    // SET BRANDs
    */
    vm.setBrand = function(brand) {
      if (vm.currentBrand) {
        vm.prevBrand = vm.currentBrand;
      }
      vm.currentBrand = brand;
      vm.temp.queryBrand = null;
      vm.openBrandList = false;
      vm.temp.foundBrands = [];
      vm.hasChanges = true;
    };

    /*
    // RESET BRAND
    */
    vm.resetBrand = function() {
      vm.currentBrand.trendOne = false;
      vm.hasChanges = true;

      if (vm.prevBrand) {
        vm.currentBrand = vm.prevBrand;
        vm.prevBrand = null;
      } else {
        vm.prevBrand = vm.currentBrand;
        vm.currentBrand = null;
      }
    };

    /*
    // SUBMIT
    */
    vm.submit = function() {
      if (vm.currentBrand) {
        vm.currentBrand.trendOne = true;
        goUpdateBrand(vm.currentBrand, finalStep);
      } else if (vm.prevBrand) {
        vm.prevBrand.trendOne = false;
        goUpdateBrand(vm.prevBrand, finalStep);
      }

      function finalStep() {
        vm.temp.queryBrand = null;
        vm.hasChanges = false;
        if (vm.prevBrand) {
          vm.prevBrand.trendOne = false;
          goUpdateBrand(vm.prevBrand);
        }
      }
    };

    /*
    // SUPPORT FNC`s
    */
    var goUpdateBrand = function(brand, cb) {
      Brand.prototype$updateAttributes({id: brand.id}, {trendOne: brand.trendOne},
        function(response) { cb && cb(response) },
        function(err) { alert(err.data.error.message); }
      )
    };
  }

})(angular);
