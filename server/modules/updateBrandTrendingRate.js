var app = require('../server'),
    Promise = require('promise');

module.exports = function() {

  var Brand = app.models.Brand;


  /*
  // FIND BRAND FROM TRENDING RATE
  */
  var promiseFindBrands = new Promise(function(resolve, reject) {
    Brand.find({where: {'trending.date': {gt: 1}}}, function(err, brands) {
      resolve(brands);
    });
  });

  promiseFindBrands.then(function(response) {
    setTrendingRate(response);
  });


  /*
  // REMOVE RATE
  */
  var removeTrendingRate = function(ids) {
    var promiseRemoveTrendingRate = new Promise(function(resolve, reject) {
      if (!ids || !ids.length) {
        resolve();
        return;
      }

      Brand.find({where: {id: {inq: ids}}}, function(err, brands) {
        if (err || !brands || !brands.length) {
          resolve();
          return;
        }

        var items4Update = {};
        brands.forEach(function(brand) {
          brand.trending = null;
          items4Update[brand.id] = brand;
        });

        Brand._updateItemsByAttributes(items4Update, ['trending'], function(err, info) {
          resolve({
            msg: err,
            info: info
          });
        });
      });
    });

    promiseRemoveTrendingRate.then(function(response) {
      if (response.msg) {
        console.log('Remove trending rate was failed: ' + response.msg);
      } else if (response.info && response.info.count) {
        console.log('Removed ' + response.info.count + ' trending rate positions.');
      }
    });
  };


  /*
  // CALCULATE TRENDING RATE
  */
  var setTrendingRate = function(prevWeekBrands) {
    var promiseSetTrendingRate = new Promise(function(resolve, reject) {
      var total = {
            n: app.get('trendingRate').minVotes,
            ar: 0,
            stats: {}
          },
          arSum = 0;

      // Get all brands
      Brand.find({}, function(err, brands) {
        if (err || !brands || !brands.length) {
          resolve(null, null);
          return;
        }

        // Take params
        brands.forEach(function (brand) {
          arSum += brand.avgRate || 0;
          total.stats[brand.id] = {
            nrb: brand.reviews.length,
            arb: brand.avgRate
          };
        });

        total.ar = Math.round((arSum / brands.length) * 100) / 100;
        var items = [],
            brandObjs = {},
            requestItems = [],
            result = {},
            sortedItems;

        // Calculate for each brand trendingRate and prepare comfortable view for params
        brands.forEach(function(brand) {
          brandObjs[brand.id] = brand;
          total.stats[brand.id].brandId = brand.id;
          total.stats[brand.id].trendingRate = Math.round(((total.stats[brand.id].nrb / (total.stats[brand.id].nrb + total.n)) * total.stats[brand.id].arb + (total.n / (total.stats[brand.id].nrb + total.n)) * total.ar) * 100) / 100;
          items.push({
            brandId: brand.id,
            trendingRate: total.stats[brand.id].trendingRate
          });
        });

        // Sort by max rate
        sortedItems = sortBy(items, 'trendingRate');
        if (sortedItems) {
          requestItems = sortedItems.slice(0, app.get('trendingRate').maxBrands);
        }

        requestItems.forEach(function(item, index) {
          var rateItem = brandObjs[item.brandId].toJSON();

          if (rateItem.trending) {
            rateItem.trending.changeIndex = rateItem.trending.index - index;
            rateItem.trending.index = index;
            rateItem.trending.date = new Date().getTime();
            rateItem.trending.rate = item.trendingRate;
          } else {
            rateItem.trending = {
              index: index,
              date: new Date().getTime(),
              rate: item.trendingRate
            };
          }

          result[item.brandId] = rateItem;
        });

        // Prepare ids for remove from rate
        var removeIds = [];
        prevWeekBrands.forEach(function(item) {
          if (Object.keys(result).indexOf(item.id) === -1) {
            removeIds.push(item.id);
          }
        });

        resolve({
          updateBrands: result,
          removeIds: removeIds
        });
      });

    });

    promiseSetTrendingRate.then(function(response) {
      Brand._updateItemsByAttributes(response.updateBrands, ['trending'], function(err, info) {
        if (err) {
          console.log('Update trending rate was failed: ' + err);
        } else if (info && info.count) {
          console.log('Updated ' + info.count + ' trending rate positions.');
        }

        removeTrendingRate(response.removeIds);
      });
    });
  };


  /*
  // SORT BY
  */
  var sortBy = function (items, by) {
    if (!items || !by) {
      return items;
    }

    var A = items,
        n = items.length;

    for (var i = 0; i < n-1; i++) {
      for (var j = 0; j < n-1-i; j++) {
        var x = A[j+1][by] || 0,
            y = A[j][by] || 0;

        if (x > y) {
          var t = A[j+1];
          A[j+1] = A[j];
          A[j] = t;
        }
      }
    }

    return items;
  };

};
