var async = require('async');

module.exports = function (BrandsByCountries) {


  /*
   // PREVENTS
   */
  BrandsByCountries.observe('before save', function (ctx, next) {
    var instance = ctx[ctx.instance ? 'instance' : 'currentInstance'];

    if (instance) {
      if (ctx.isNewInstance) {
        instance.createdAt = new Date().getTime();
      }
      instance.modifiedAt = new Date().getTime();
    }

    next();
  });


  /*
  // EXTEND METHODS
  */
  var updateBrands = function(filterParams, updateType, callback) {
    var Brand = BrandsByCountries.app.models.Brand,
        supTypes = ['add', 'edit', 'delete'],
        reqParams = {where: filterParams};

    if (!updateType || supTypes.indexOf(updateType) === -1) {
      return callback('Unknown operation type');
    }

    if (updateType === 'edit') {
      reqParams.where = {
        id: filterParams.id
      }
    }

    BrandsByCountries.find(reqParams, function(err, bbcs) {
      if (err || !bbcs) {
        return callback(err.message || 'Incorrect params');
      }

      // EACH LIST
      var tasks = bbcs.map(function(bbc) {
        return function(cb) {
          // bbc.brands
          var brandsTitles = [];

          filterParams.brands && filterParams.brands.forEach(function(brandTitle) {
            if (bbc.brands.indexOf(brandTitle) === -1) {
              brandsTitles.push(brandTitle)
            }
          });

          brandsTitles = brandsTitles.concat(bbc.brands);

          Brand.find({where: {title: {inq: brandsTitles || bbcs.brands}}}, function(err, brands) {
            var brandsUpdateCounter = 0;

            if (updateType !== 'edit') {
              // CREATE | DELETE
              createDeleteBBC(brands, bbc, brandsUpdateCounter, cb)
            } else {
              // ON EDIT MODE
              editBBC(filterParams, brands, bbc, brandsUpdateCounter, cb);
            }
          });
        };
      });

      async.parallel(tasks, function(err, results) {
        callback(err, results);
      });
    });

    // SUPPORT FNC`s
    /*
     ** DELETE LIST
     */
    function createDeleteBBC(brands, bbc, index, cb) {
      var bbcCountries = bbc.countries.map(function(item) { return item.key; });

      if (!brands || !brands.length) {
        return cb(null, bbc);
      }

      // EACH BRAND`s COUNTRY
      brands.forEach(function(brand) {
        index++;

        if (updateType === 'add') {
          bbcCountries.forEach(function(countryCode) {
            if (brand.countries.indexOf(countryCode) === -1) {
              brand.countries.push(countryCode);
            }
          });
        } else if (updateType === 'delete') {
          brand.countries = brand.countries.filter(function(countryCode) {
            return bbcCountries.indexOf(countryCode) === -1;
          });
        }

        updateAttr(brands.length, brand, bbc, index, cb);
      });
    }

    /*
     ** EDIT LIST
     */
    function editBBC(filterParams, brands, bbc, index, cb) {
      var updateList = [],
          bbcCountries = bbc.countries.map(function(item) { return item.key; }),
          addedCountriesKeys = [],
          removedCountriesKeys = [];

      var prevCountriesKeys = filterParams.countries.map(function(country) { return country.key }),
          currentCountriesKeys = bbc.countries.map(function(country) { return country.key });

      addedCountriesKeys = prevCountriesKeys.filter(function(countryKey) {
        return currentCountriesKeys.indexOf(countryKey) === -1;
      });

      removedCountriesKeys = currentCountriesKeys.filter(function(countryKey) {
        return prevCountriesKeys.indexOf(countryKey) === -1;
      });

      brands.forEach(function(brand) {
        //
        function toRemove(brand) {
          brand.countries = brand.countries.filter(function(countryCode) {
            return bbcCountries.indexOf(countryCode) === -1;
          });

          updateList.push(brand);
        }
        //
        function toAdd(brand) {
          var hasMatches = false;

          bbcCountries.forEach(function(countryCode) {
            var hasCountry = brand.countries.indexOf(countryCode) !== -1;

            if (!hasCountry) {
              hasMatches = true;
              brand.countries.push(countryCode);
            }
          });

          if (hasMatches) {
            updateList.push(brand);
          }
        }
        //
        function changeCountries(brand, countriesKeys, type) {
          var hasMatches = false;

          if (type == 'add') {
            countriesKeys.forEach(function(key) {
              if (brand.countries.indexOf(key) === -1) {
                hasMatches = true;
                brand.countries.push(key);
              }
            });
          }

          if (type == 'delete') {
            brand.countries = brand.countries.filter(function(countryCode) {
              var countryMatch = countriesKeys.indexOf(countryCode) !== -1;

              if (countryMatch) {
                hasMatches = true;
              }

              return !countryMatch;
            });
          }

          if (hasMatches) {
            updateList.push(brand);
          }
        }

        // countries changes
        if (addedCountriesKeys.length) {
          changeCountries(brand, addedCountriesKeys, 'add');
        }
        if (removedCountriesKeys.length) {
          changeCountries(brand, removedCountriesKeys, 'delete');
        }

        if (filterParams.brands.indexOf(brand.title) !== -1) {
          // add to `add` list
          toAdd(brand);
        } else {
          // add to `remove` list
          toRemove(brand);
        }
      });

      if (!updateList.length) {
        return cb(null, bbc);
      }

      updateList.forEach(function(updatedBrand) {
        index++;
        updateAttr(updateList.length, updatedBrand, bbc, index, cb);
      });
    }

    function updateAttr(totalLength, brand, bbc, index, cb) {
      if (!totalLength) {
        return cb(null, bbc);
      }

      Brand.updateAll({id: brand.id || 'ghost'}, {countries: brand.countries}, function(err, info) {
        if (totalLength === index) {
          cb(null, bbc);
        }
      });
    }
  };

  // CREATE
  BrandsByCountries._create = function(data, next) {
    BrandsByCountries.create(data, function(err, info) {
      if (err) {
        return next(err.message)
      }

      updateBrands({id: info.id}, 'add', next);
    });
  };

  //
  BrandsByCountries.remoteMethod(
    '_create',
    {
      http: {path: '/custom-create'},
      accepts: {arg: 'data', type: 'object', required: true},
      returns: {arg: 'info', type: 'object'}
    }
  );

  // SAVE
  BrandsByCountries._save = function(instance, next) {
    var saveFnc = function() {
      BrandsByCountries.findById(instance.id, function (err, bbc) {
        if (err || !bbc) {
          return next(err || 'Instance not found');
        }

        bbc.updateAttributes(instance, function(err, info) {
          next(err, info);
        });
      });
    };

    updateBrands(instance, 'edit', saveFnc);
  };

  //
  BrandsByCountries.remoteMethod(
    '_save',
    {
      http: {path: '/custom-save'},
      accepts: {arg: 'instance', type: 'object', required: true},
      returns: {arg: 'info', type: 'object'}
    }
  );

  // DELETE
  BrandsByCountries._delete = function(params, next) {
    var destroyFnc = function() {
      BrandsByCountries.destroyById(params._id, function(err, info) {
        next(err, info);
      });
    };

    updateBrands(params, 'delete', destroyFnc);
  };

  //
  BrandsByCountries.remoteMethod(
    '_delete',
    {
      http: {path: '/custom-delete'},
      accepts: {arg: 'where', type: 'object', required: true},
      returns: {arg: 'info', type: 'object'}
    }
  );

};
