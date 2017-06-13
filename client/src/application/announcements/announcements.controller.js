(function(angular) {
  'use strict';

  angular
    .module('application.announcementsCtrl', [])
    .controller('AnnouncementsCtrl', AnnouncementsCtrl);


  function AnnouncementsCtrl($scope, Subcategory, Brand, Review, UserModel, IncomeRange, config, $location, $state, $validationRules, serverHost) {
    var vm = this,
        reqParams = {
          filter: {
            where: {},
            fields: ['id', 'title', 'image']
          }
        };

    vm.config = config;
    vm.validators = $validationRules;
    vm.form = { from: 'brandbeat' };
    vm.temp = {
      minBrandRate: 5,
      subscriptions: {},
      brands: {},
      foundBrandsFrom: [],
      foundBrands: []
    };
    vm.onComplete = {
      duration: 1200,
      success: false,
      cb: function() {
        $state.go($state.current, {}, {reload: true});
      }
    };

    /*
     // AUTOCOMPLETE
     */
    var countryEl = document.getElementById('country'),
        cityEl = document.getElementById('city'),
        autocompleteCountry = new google.maps.places.Autocomplete(countryEl, {types: ['(regions)']}),
        autocompleteCity = new google.maps.places.Autocomplete(cityEl, {types: ['(cities)']});

    // SEARCH COUNTRY
    autocompleteCountry.addListener('place_changed', function () {
      var placeData = autocompleteCountry.getPlace();

      if (!placeData) {
        return;
      }

      var countryShortName = placeData['address_components'][0]['short_name'];

      vm.form.country = placeData.name;
      autocompleteCity.setComponentRestrictions({country: countryShortName});
      $scope.$apply();

      vm.filterUsers();
      vm.initIncomeRanges(vm.form.country);
    });

    // SEARCH CITY
    autocompleteCity.addListener('place_changed', function () {
      var placeData = autocompleteCity.getPlace();

      vm.form.city = placeData.name;
      angular.element(cityEl).value = placeData.name;
      $scope.$apply();

      vm.filterUsers();
    });

    /*
     // CHANGE FIELDS
     */
    vm.changeField = function (value, fieldType) {

      if (fieldType === 'country') {
        if (!value) {
          delete vm.form.country;
          delete vm.form.city;
          delete vm.form.incomeRanges;
        } else {
          vm.form.country = value;
          vm.initIncomeRanges(value);
        }

        vm.filterUsers();
      }
      if (fieldType === 'city') {
        if (!value) {
          delete vm.form.city;
        }

        vm.filterUsers();
      }
    };

    /*
     // FILLING BRANDS (EMPTY QUERY)
     */
    vm.fillSearchBrands = function(query, listName) {
      if (!query) {
        reqParams.filter.where = {};

        Brand.find(reqParams, function(brands) {
          vm.temp[listName] = brands;
          vm.temp[listName + 'Open'] = true;
        });
      } else if (vm.temp.currentBrandFrom) {
        query = null;
        vm.temp[listName + 'Query'] = null;
      }
    };

    /*
    // SEARCH FROM* BRAND
    */
    vm.searchFromBrand = function() {
      if (vm.temp.foundBrandsFromQuery) {
        var pattern = vm.temp.foundBrandsFromQuery + '/i';
        Brand.find({filter: {where: {title: {regexp: pattern}}}}, function(brands) {
          vm.temp.foundBrandsFrom = brands;
        });
      } else {
        vm.temp.brands = {};
      }

      if (vm.temp.currentBrandFrom && vm.temp.foundBrandsFromQuery.title !== vm.temp.foundBrandsFromQuery) {
        vm.temp.currentBrandFrom = null;
      }
    };

    /*
    // SET FROM* BRAND
    */
    vm.setBrandFrom = function(brand) {
      vm.temp.foundBrandsFromQuery = brand.title;
      vm.temp.currentBrandFrom = brand;
    };

    /*
    // INIT INCOME RANGES
    */
    vm.initIncomeRanges = function (country) {
      var rangeAllArr = ['All'];

      delete vm.form.incomeRanges;

      if (country) {
        IncomeRange.find({filter: {where: {country: country}}}, function(incomeRanges) {
          if (incomeRanges && incomeRanges.length) {
            vm.incomeRangesList = rangeAllArr.concat(incomeRanges[0].ranges);
          } else {
            IncomeRange.findOne({filter: {where: {country: 'any'}}}, function(incomeRange) {
              if (incomeRange) {
                vm.incomeRangesList = rangeAllArr.concat(incomeRange.ranges);
              }
            });
          }
        });
      } else {
        delete vm.incomeRangesList;
      }
    };

    /*
    // SELECT INCOME RANGE
    */
    vm.setIncomeRange = function (income) {
      !vm.form.incomeRanges && (vm.form.incomeRanges = []);

      if (vm.form.incomeRanges.indexOf('All') !== -1 && income !== 'All') {
        vm.form.incomeRanges = vm.form.incomeRanges.filter(function (item) {
          if (item !== 'All') {
            return item;
          }
        });
      }
      vm.form.incomeRanges.push(income);

      if (income === 'All' && vm.form.incomeRanges.length) {
        vm.form.incomeRanges = ['All'];
      }

      vm.filterUsers();
    };


    /*
    // PREPARE CATEGORIES | SUBCATEGORIES DATA
    */
    Subcategory.find({filter: {include: 'category'}}, function(subcategories) {
      var categories = {};

      subcategories.forEach(function(subcategory) {
        if (!categories.hasOwnProperty(subcategory.category.title)) {
          categories[subcategory.category.title] = [];
        }

        categories[subcategory.category.title].push(subcategory);
      });

      vm.catSubcatList = categories;
    });

    /*
    // SELECT SUBSCRIPTIONS
    */
    vm.setSubs = function(currentItem, type) {
      var current,
          subscriptionsFiltered = {};

      if (type === 'category') {
        current = currentItem[0].category;

        for (var pName in vm.temp.subscriptions) {
          if (vm.temp.subscriptions.hasOwnProperty(pName) && current.subcategories.indexOf(pName) === -1) {
            subscriptionsFiltered[pName] = vm.temp.subscriptions[pName];
          }
        }
        vm.temp.subscriptions = subscriptionsFiltered;
        !vm.temp.subscriptions[current.id] && (vm.temp.subscriptions[current.id] = current);
      } else {
        current = currentItem;

        for (var pName in vm.temp.subscriptions) {
          if (vm.temp.subscriptions.hasOwnProperty(pName) && !vm.temp.subscriptions[current.category.id]) {
            !vm.temp.subscriptions[current.id] && (vm.temp.subscriptions[current.id] = current);
          }
        }

        if (!Object.keys(vm.temp.subscriptions).length) {
          !vm.temp.subscriptions[current.id] && (vm.temp.subscriptions[current.id] = current);
        }
      }

      vm.filterUsers();
    };

    /*
    // DELETE SELECTED ITEM
    */
    vm.deleteItem = function(item, type) {
      var subscriptionsFiltered = {},
          sourceType = 'temp';

      if (type === 'incomeRanges') {
        sourceType = 'form';

        vm[sourceType][type] = vm[sourceType][type].filter(function (sourceItem) {
          if (sourceItem !== item) {
            return sourceItem;
          }
        });
      } else {
        for (var pName in vm[sourceType][type]) {
          if (vm[sourceType][type].hasOwnProperty(pName) && pName !== item.id) {
            subscriptionsFiltered[pName] = vm[sourceType][type][pName];
          }
        }

        vm[sourceType][type] = subscriptionsFiltered;
      }

      vm.filterUsers();
    };

    /*
    // SEARCH BRANDs
    */
    vm.searchBrand = function() {
      if (vm.temp.foundBrandsQuery) {
        var pattern = vm.temp.foundBrandsQuery + '/i';
        Brand.find({filter: {where: {title: {regexp: pattern}}}}, function(brands) {
          vm.temp.foundBrands = brands;
        });
      } else {
        vm.temp.brands = {};
      }
    };

    /*
    // SET BRANDs
    */
    vm.setBrand = function(brand) {
      if (!vm.temp.brands[brand.id]) {
        vm.temp.brands[brand.id] = brand;
      }

      vm.temp.foundBrandsQuery = null;
      delete vm.temp.foundBrands;
      vm.filterUsers();
    };

    /*
    // SET MINIMAL RATE OF BRAND
    */
    vm.setMinRate = function(state) {
      if (state) {
        Review.find({filter: {fields: ['id', 'authorId'], where: {rate: vm.temp.minBrandRate, brandId: vm.temp.currentBrandFrom.id}}}, function(reviews) {
          var authorsIds = [];

          reviews.forEach(function(review) {
            if (authorsIds.indexOf(review.authorId) === -1) {
              authorsIds.push(review.authorId);
            }
          });

          vm.users = vm.users.filter(function(user) {
            if (authorsIds.indexOf(user.id) !== -1) {
              return user;
            }
          });
        });
      } else {
        vm.filterUsers();
      }
    };

    /*
    // FILTER USERS
    */
    vm.filterUsers = function() {
      var conditions = {};

      // gender
      if (vm.form.gender) {
        conditions['gender'] = vm.form.gender === 'female' ? 1 : 0;
      }

      // country
      if (vm.form.country) {
        conditions['address.country'] = vm.form.country.toLowerCase();
      }

      // city
      if (vm.form.city) {
        conditions['address.city'] = vm.form.city.toLowerCase();
      }

      // income range
      if (vm.form.incomeRanges && vm.form.incomeRanges.length) {
        if (vm.form.incomeRanges.indexOf('All') === -1) {
          conditions['incomeRange'] = {inq: vm.form.incomeRanges};
        } else {
          delete conditions['incomeRange'];
        }
      }

      // categories | subcategories
      if (vm.temp.subscriptions) {
        for (var pName in vm.temp.subscriptions) {
          if (vm.temp.subscriptions.hasOwnProperty(pName)) {
            var type = !vm.temp.subscriptions[pName].parentId ? 'categories' : 'subcategories';
            !conditions[type] && (conditions[type] = []);
            conditions[type].push(vm.temp.subscriptions[pName].id);
          }
        }
      }

      // brands
      if (vm.temp.brands) {
        for (var pName in vm.temp.brands) {
          if (vm.temp.brands.hasOwnProperty(pName)) {
            !conditions.brands && (conditions.brands = []);
            conditions.brands.push(vm.temp.brands[pName].id);
          }
        }
      }

      UserModel.find({filter: {fields: ['id', 'email'], where: conditions}}, function(users) {
        vm.users = users;

        // filter by rate
        if (vm.temp.onlyMaxRate) {
          vm.setMinRate(vm.temp.onlyMaxRate);
        }
      });
    };

    /*
    // SEND NOTIFICATIONS
    */
    vm.submit = function() {
      var notify = {
            type: null,
            image: null,
            from: null,
            to: vm.users.map(function(user) { return user.id; }),
            text: vm.form.text
          };

      if (vm.form.from === 'brandbeat') {
        notify.type = 7;
        notify.from = 'brandbeat';
        notify.image = serverHost + config.restApiRoot + config.paths.logoImg;
      } else {
        notify.type = 8;
        notify.from = vm.temp.currentBrandFrom.title;
        notify.image = vm.temp.currentBrandFrom.image;
        notify.brandId = vm.temp.currentBrandFrom.id;
      }

      if (notify.to.length) {
        UserModel._setSystemNotifications({params: notify}, function(response) {
          vm.onComplete.success = true;
          vm.onComplete.text = 'Announcements has been sent';
        });
      }
    };

    // INIT
    vm.filterUsers();
  }

})(angular);
