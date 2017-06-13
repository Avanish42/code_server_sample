var app = require('../server'),
    async = require('async');

module.exports = function(params) {

  var Subcategory = app.models.Subcategory,
      Brand = app.models.Brand,
      Review = app.models.Review;


  /*
   ** FIND AND CLEAR
   */
  Subcategory.find({}, function(err, subcategories) {

    // REMOVE EXCESS BRANDS ID`s FROM SUBCATEGORY LIST OF BRANDS
    /*if (subcategories && subcategories.length) {
      var tasks = [];

      subcategories.forEach(function (subcategory) {
        var subcategoryJSON = subcategory.toJSON(),
            needUpdate = false,
            brandsList = {},
            task;

        subcategoryJSON.brands.forEach(function(brandId) {
          if (!brandsList[brandId]) {
            brandsList[brandId] = 1
          } else {
            brandsList[brandId]++;
            needUpdate = true;
          }
        });

        if (needUpdate) {
          task = function(cb) {
            subcategory.updateAttributes({brands: Object.keys(brandsList)}, function() {
              cb();
            })
          };

          tasks.push(task);
        }
      });

      async.parallel(tasks, function(err, result) {
        console.log('Subcategories brands filtered!');
      })
    }


    //
    return;*/

    var brandOnSubcategory = {},
        subcategoriesList = {},
        removeCounter = 0;

    if (subcategories && subcategories.length) {
      subcategories.forEach(function(subcategory) {
        subcategory.brands.forEach(function(brandId) {
          brandId += '';

          if (!brandOnSubcategory[brandId]) {
            brandOnSubcategory[brandId] = subcategory;
          }
        });
      });

      if (Object.keys(brandOnSubcategory).length) {
        Brand.find({where: {id: {inq: Object.keys(brandOnSubcategory)}}}, function(err, brands) {
          if (brands && brands.length) {
            // update clearing list
            brands.forEach(function(brand) {
              var id = String(brand.id);

              if (brandOnSubcategory[id]) {
                delete brandOnSubcategory[id];
              }
            });
          }

          if (Object.keys(brandOnSubcategory).length) {
            // prepare subcategories list
            Object.keys(brandOnSubcategory).forEach(function(subcategoryId) {
              if (!subcategoriesList[subcategoryId]) {
                subcategoriesList[subcategoryId] = brandOnSubcategory[subcategoryId];
              }
            });

            // clear data in subcategories
            async.parallel(Object.keys(subcategoriesList).map(function(subcategoryId) {
              return function(cb) {
                var subcategory = subcategoryJSON = subcategoriesList[subcategoryId],
                    subcategoryJSON = subcategory.toJSON(),
                    subcategoryBrandsIds = subcategoryJSON.brands;

                subcategoryBrandsIds = subcategoryBrandsIds.filter(function(subcategoryBrandId) {
                  removeCounter++;
                  return Object.keys(brandOnSubcategory).indexOf(subcategoryBrandId) === -1;
                });

                subcategory.updateAttributes({brands: subcategoryBrandsIds}, function(err, instance) {
                  cb();
                })
              }
            }), function(err, result) {
              // clear reviews from not exists brands
              Review.destroyAll({brandId: {inq: Object.keys(brandOnSubcategory)}}, function(err, info) {
                console.log('Brands list in `subcategories` was cleared, deleted `' + removeCounter + '` items.');
              });
            });
          }
        });
      }
    }
  });
};
