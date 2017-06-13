(function(angular) {
  'use strict';

  angular
    .module('application.suggestedBrandsCtrl', [])
    .controller('SuggestedBrandsCtrl', SuggestedBrandsCtrl);


  function SuggestedBrandsCtrl(Reference, Category, Brand, config) {
    var vm = this;

    vm.config = config;
    vm.temp = {
      country: null,
      selectedCountry: {}
    };
    vm.currentCountryCode = null;
    vm.prevBrand = null;


    // Prepare references: countries
    Reference.find({filter: {where: {type: 'country'}}}, function(countries) {
      if (countries && countries.length) {
        vm.temp.countries = countries;
      }
    });

    // Prepare `Categories`
    vm.categories = Category.find({filter: {fields: ['id', 'title']}}, function(categories) {
      vm.categories = categories;
    });

    // Search active brand from category
    vm.searchActiveBrand = function(country, category, countryCode) {
      if (!country || !category) {
        return;
      }

      var reqParams = {
            filter: {
              where: {
                countries: country,
                categoryId: category.id
              }
            }
          };

      reqParams.filter.where['suggested.' + (countryCode || country)] = true;

      Brand.find(reqParams, function(brands) {
        vm.prevBrand = brands[0];
        vm.currentBrand = brands[0];
      });
    };

    // Select `Country`
    vm.selectCountry = function(country, category) {
      if (!country) {
        return;
      }

      if (vm.currentCountryCode && vm.currentCountryCode === country.key) {
        if (category) {
          vm.searchActiveBrand(vm.currentCountryCode, category, vm.temp.selectedCountry.key);
        }
      } else {
        Brand._checkCountryOnBrands({country: country.key}, function(response) {
          vm.currentCountryCode = response.country;
          if (category) {
            vm.searchActiveBrand(vm.currentCountryCode, category, vm.temp.selectedCountry.key);
          }
        });
      }
    };

    /*
     // FILLING BRANDS by COUNTRY and CATEGORY
     */
    vm.fillSearchBrands = function(query, country, category) {
      if (query || !country || !category) {
        return;
      }

      var reqParams = {
        filter: {
          where: {
            countries: country,
            categoryId: category.id
          }
        }
      };

      Brand.find(reqParams, function(brands) {
        vm.foundBrands = brands;
        vm.openBrandList = true;
      })
    };

    /*
     // SEARCH BRANDs
     */
    vm.searchBrand = function(query, country, category) {
      if (query) {
        var reqParams = {
              filter: {
                where: {
                  countries: country,
                  categoryId: category.id,
                  or: [
                    {title: {regexp: query}},
                    {title: {regexp: query.toUpperCase()}}
                  ]
                }
              }
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
     // SET BRANDs
     */
    vm.setBrand = function(brand) {
      vm.currentBrand = brand;
      vm.temp.queryBrand = null;
      vm.openBrandList = false;
      vm.temp.foundBrands = [];
    };

    /*
     // RESET BRAND
     */
    vm.resetBrand = function(country) {
      vm.currentBrand = null;
      updateSuggestedBrand(vm.prevBrand, country, false);
    };

    /*
     // SUBMIT
     */
    vm.submit = function() {
      if (!vm.currentCountryCode) {
        return;
      }

      if (vm.prevBrand && !vm.currentBrand || (vm.prevBrand && vm.currentBrand) && (vm.prevBrand.id === vm.currentBrand.id)) {
        updateSuggestedBrand(vm.prevBrand, vm.temp.selectedCountry.key, false);

        goUpdateBrand(vm.prevBrand, function () {
          if (vm.currentBrand) {
            updateSuggestedBrand(vm.currentBrand, vm.temp.selectedCountry.key, true);
            goUpdateBrand(vm.currentBrand, vm.finalStep);
          } else {
            vm.finalStep();
          }
        });
      } else if (vm.currentBrand && vm.temp.selectedCountry) {
        updateSuggestedBrand(vm.currentBrand, vm.temp.selectedCountry.key, true);
        goUpdateBrand(vm.currentBrand, vm.finalStep);
      }
    };

    /*
     // SUPPORT FNC`s
     */
    var goUpdateBrand = function(brand, cb) {
      Brand.prototype$updateAttributes({id: brand.id}, {suggested: brand.suggested},
        function(response) { cb(response) },
        function(err) { alert(err.data.error.message); }
      )
    };

    var updateSuggestedBrand = function(brand, country, value) {
      if (!brand || !country || typeof value === 'undefined') {
        return;
      }

      if (typeof brand.suggested !== 'object') {
        brand.suggested = {};
      }
      brand.suggested[country] = value;
    };

    vm.finalStep = function() {
      vm.openBrandList = false;
      vm.temp.selectedCategory = null;
      vm.temp.queryBrand = null;
      vm.prevBrand = null;
      vm.currentBrand = null;
    };
  }

})(angular);
