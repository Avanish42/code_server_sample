(function(angular) {
  'use strict';

  angular
    .module('application.modalAddBByCCtrl', [])
    .controller('ModalAddBByCCtrl', ModalAddBByCCtrl);


  function ModalAddBByCCtrl($modalInstance, $validationRules, $helpers, config, Reference, Brand, BrandsByCountries, modalParams) {
    var vm = this,
        editMode = modalParams.type === 'edit';

    // PARAMS
    vm.title = (!editMode ? 'Add ' : 'Edit') + ' Brands and Countries List';
    vm.validators = $validationRules;
    vm.config = config;
    vm.static = {};
    vm.temp = {
      countries: [],
      brands: []
    };
    vm.form = {
      countries: [],
      brands: [],
      countriesDisabled: false,
      brandsDisabled: false
    };
    vm.errors = [];

    if (editMode) {
      handlerInitEditData(modalParams, vm.form);
    }

    /* Prepare references: countries */
    Reference.find({filter: {where: {type: 'country'}}}, function(countries) {
      var usedCountriesTitles = modalParams.usedCountries.map(function(country) {
        return country.title;
      });

      countries.forEach(function(item) {
        if (usedCountriesTitles.indexOf(item.title) === -1) {
          vm.temp.countries.push({ title: item.title, key: item.key });
        }
      });
    });

    /* Prepare brands */
    Brand.find({}, function(brands) {
      vm.static.brands = brands;
      vm.temp.brands = [];

      brands.forEach(function(item) {
        if (vm.form.brands.indexOf(item.title) === -1) {
          vm.temp.brands.push(item.title);
        }
      });
    });

    // ADD TO LIST
    vm.addEssence = function(data, essenceType) {
      if (!data || !data.length) {
        return;
      }

      if (essenceType === 'countries') {
        var currentCountriesKeys = vm.form[essenceType].map(function(currentCountry) {
          return currentCountry.key;
        });

        data = data.filter(function(newCountry) {
          return currentCountriesKeys.indexOf(newCountry.key) === -1;
        });

        // disabled another layout (brands)
        vm.form.brandsDisabled = true;
      }

      if (essenceType === 'brands') {
        data = data.filter(function(brandTitle) {
          return vm.form[essenceType].indexOf(brandTitle) === -1;
        });

        // disabled another layout (countries)
        vm.form.countriesDisabled = true;
      }

      vm.form[essenceType] = vm.form[essenceType].concat(data);

      vm.errors = [];
      vm.temp[essenceType] = vm.temp[essenceType].filter(function(item) {
        return data.indexOf(item) === -1;
      });
    };

    // REMOVE FROM LIST
    vm.removeEssence = function(data, essenceType) {
      if (!data) {
        return;
      }

      if (essenceType === 'countries') {
        // disabled another layout (brands)
        vm.form.brandsDisabled = true;
      }

      if (essenceType === 'brands') {
        // disabled another layout (countries)
        vm.form.countriesDisabled = true;
      }

      vm.form[essenceType] = vm.form[essenceType].filter(function(item) {
        return data.indexOf(item) === -1;
      });

      //if (essenceType === 'countries') {
        // RETURN USED COUNTRY TO LIST "ALL"
        vm.temp[essenceType] = vm.temp[essenceType].concat(data);
        vm.temp[essenceType] = vm.temp[essenceType].sort(function(a, b) {
          if (essenceType === 'countries') {
            if(a.title < b.title) return -1;
            if(a.title > b.title) return 1;
          }
          if (essenceType === 'brands') {
            if(a < b) return -1;
            if(a > b) return 1;
          }

          return 0;
        });
      //}
    };

    // SUBMIT
    vm.submit = function () {
      vm.errors = handlerCheckForm(vm.form);

      if (vm.errors.length) {
        return;
      }

      // disable off
      vm.form.countriesDisabled = false;
      vm.form.brandsDisabled = false;

      if (!editMode) {
        // ON CREATE
        BrandsByCountries._create({data: vm.form},
          function(response) {
            if (typeof modalParams.callback === 'function') {
              modalParams.callback(response.info ? response.info[0] : null);
            }
            $modalInstance.close();
          },
          function(err) {
            var cb = function() { vm.errors.push(err.data.error.message) };
            $helpers.handlerResponseError(err, cb);
          }
        );
      } else {
        // ON EDIT
        Object.keys(vm.form).forEach(function(key) {
          modalParams.list[key] = vm.form[key];
        });

        if (modalParams.list.type !== 'standart') {
          modalParams.list.countries = [{title: modalParams.list.type, key: '#' + modalParams.list.type}];
        }

        BrandsByCountries._save({instance: modalParams.list},
          function(instance) {
            $modalInstance.close();
          },
          function(err) {
            var cb = function() { vm.errors.push(err.data.error.message) };
            $helpers.handlerResponseError(err, cb);
          }
        );
      }
    };

    //
    vm.cancel = function() {
      // disable off
      vm.form.countriesDisabled = false;
      vm.form.brandsDisabled = false;
      $modalInstance.dismiss('cancel');
    };
  }


  /* SUPPORT FNC`s */
  function handlerCheckForm(form) {
    var errors = [];

    if (form.type !== 'generic' && !form.countries.length) {
      errors.push('Please select at least one country');
    }

    return errors;
  }

  //
  function handlerInitEditData(modalParams, form) {
    Object.keys(modalParams.list).forEach(function(key) {
      form[key] = modalParams.list[key];
    });
  }

})(angular);
