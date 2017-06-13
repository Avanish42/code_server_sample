var promise = require('promise'),
    async = require('async'),
    GM = require('gm'),
    fs = require('fs'),
    request = require('request'),
    ObjectID = require('mongodb').ObjectID,
    DSConfig = require('../datasources'),
    CheckCountryOnBrands = require('../modules/checkCountryOnBrands');

module.exports = function (Brand) {

  /*
   ** PREVENTS
   */
  Brand.observe('before save', function (ctx, next) {
    var instance = ctx[ctx.instance ? 'instance' : 'currentInstance'];
    if (instance) {
      !instance.createdAt && (instance.createdAt = new Date().getTime());
      instance.modifiedAt = new Date().getTime();
    }
    next();
  });

  Brand.observe('persist', function(ctx, next) {
    if (ctx.currentInstance && ctx.currentInstance.useValidation) {
      var err = new Error('complete');
      err.statusCode = 409;
      return next(err);
    }
    next();
  });

  Brand.beforeRemote('prototype.updateAttributes', function (ctx, result, next) {
    var instance = ctx[ctx.instance ? 'instance' : 'currentInstance'],
        reqParams = {
          where: {
            id: ctx.instance.id
          },
          include: [
            {
              relation: 'user',
              scope: {
                fields: ['id', 'email']
              }
            }
          ]
        };

    // CHANGE STATE
    if (ctx.req.body.state) {
      Brand.findOne(reqParams, function (err, brand) {
        if (err || !brand) {
          return next();
        }

        if (ctx.req.body.state && instance.state !== ctx.req.body.state) {
          var brandJSON = brand.toJSON(),
              emitMsg = 'brand' + ctx.req.body.state.charAt(0).toUpperCase() + ctx.req.body.state.slice(1),
              reasonBrandId,
              reason;

          if (!brandJSON.user) {
            return next();
          }

          if (ctx.req.body.state === 'rejected') {
            reason = 'You Brand: ' + instance.title + ' has been rejected. \n Reason: ' + ctx.req.body.rejectReason;
          }

          Brand.app.models.UserModel._trigger('newSystemMsg', {
            email: brandJSON.user.email,
            subject: 'Brand has been rejected',
            html: '<p>You Brand: ' + instance.title + ' has been rejected.</p><p>Reason: ' + ctx.req.body.rejectReason + '</p>'
          });

          if (ctx.req.body.rejectReason) {
            reasonBrandId = ctx.req.body.rejectReason.split(/id\:\s/);
          }

          if (reasonBrandId && reasonBrandId.length > 1) {
            reasonBrandId = reasonBrandId[1].substr(0, reasonBrandId[1].length - 1);
            Brand.findOne({where: {id: reasonBrandId}, fields: ['id', 'title', 'image']}, function (err, reasonBrand) {
              if (err || !reasonBrand) {
                return next();
              }

              Brand.app.models.UserModel.emit('systemSend', {
                state: emitMsg,
                user: brandJSON.user,
                brand: brandJSON,
                reason: reason,
                reasonBrand: reasonBrand
              });

              next();
            });
          } else {
            Brand.app.models.UserModel.emit('systemSend', {
              state: emitMsg,
              user: brandJSON.user,
              brand: brandJSON,
              reason: reason
            });
            next();
          }
        } else {
          next();
        }

      });
    } else {
      next();
    }
  });


  /*
   ** EXTENDS
   */
  // Items (params) only object type, as {objectId: object}
  Brand._updateItemsByAttributes = function(items, attributes, cb) {
    Brand.find({where: {id: {inq: Object.keys(items)}}}, function(err, brands) {
      if (err || !brands || !brands.length) {
        cb(err || null, []);
        return;
      }

      var saveCount = 0,
        errors = [],
        ids = [];

      brands.forEach(function(brand) {
        var updateObj = {};

        attributes.forEach(function(attributeName) {
          updateObj[attributeName] = items[brand.id][attributeName];
        });

        brand.updateAttributes(updateObj, function(err, instance) {
          err && (errors.push(err));
          instance && (ids.push(instance.id));
          saveCount++;

          if (saveCount === brands.length) {
            cb(errors.length ? errors : null, {count: saveCount, ids: ids});
          }
        })
      });
    });
  };


  /*
  // VALIDATION
  */
  //Brand.validatesUniquenessOf('title', {message: 'Name already exists'});
  Brand.validatesLengthOf('title', {message: { max: 'title is too long'}});


  /*
  // EXTEND METHODS
  */
  // CREATE
  Brand._create = function(data, cb) {
    var Subcategory = Brand.app.models.Subcategory;

    // BRAND SCOPE >>>
    Brand.create(data, function (err, brand) {
      if (err || !brand) {
        return cb(err || 'Creating brand failed', null);
      }

      // SUBCATEGORY SCOPE >>>
      Subcategory.findById(data.subcategoryId, function (err, subcategory) {
        if (!subcategory) {
          return cb(null, null);
        }

        subcategory.brands.push(String(brand.id));
        subcategory.updateAttributes({brands: subcategory.brands}, function (err, subcategory) {
          cb(null, brand);
        });
      });
      // SUBCATEGORY SCOPE <<<
    });
    // BRAND SCOPE <<<
  };

  Brand.remoteMethod(
    '_create',
    {
      http: {path: '/_create'},
      accepts: {arg: 'data', type: 'object', required: true},
      returns: {arg: 'instance', type: 'object'}
    }
  );

  // DELETE
  Brand._delete = function(brandId, cb) {
    var errJSON;
    // BRAND SCOPE >>>
    Brand.findById(brandId, function(err, brand) {
      if (err || !brand) {
        errJSON = {
          code: '000-404',
          message: 'Brand not found',
          errors: []
        };
        cb(errJSON, null);
        return;
      }

      brand.destroy(function(err, destroyBrandId) {
        // CONTAINER SCOPE >>>
        var imgParts = brand.image ? brand.image.split('/') : null,
            containerName,
            fileName;

        if (imgParts) {
          containerName = imgParts[imgParts.length - 2];
          fileName = imgParts[imgParts.length - 1];
        }

        Brand.app.models.Container.removeFile(containerName, fileName, function (err, info) {

          // SUBCATEGORY SCOPE >>>
          Brand.app.models.Subcategory.findById(brand.subcategoryId, function(err, subcategory) {
            if (err || !subcategory) {
              errJSON = {
                code: '000-404',
                message: 'Subcategory not found',
                errors: []
              };
              cb(errJSON, null);
              return;
            }

            subcategory.brands = subcategory.brands.filter(function(id) {
              return id !== String(brandId);
            });

            subcategory.updateAttributes({brands: subcategory.brands}, function(err, instance) {
              if (err) {
                errJSON = {
                  code: '000-500',
                  message: 'Process of updating relations failed',
                  errors: []
                };
                cb(errJSON, null);
                return;
              }

              cb(null, destroyBrandId);
            });
          });
          // SUBCATEGORY SCOPE <<<
        });
      });
    });
    // BRAND SCOPE <<<
  };

  Brand.remoteMethod(
    '_delete',
    {
      http: {path: '/_delete'},
      accepts: {arg: 'brandId', type: 'string', required: true},
      returns: {arg: 'status', type: 'object'}
    }
  );

  Brand._checkCountryOnBrands = function(country, cb) {
    CheckCountryOnBrands(country, cb);
  };

  Brand.remoteMethod(
    '_checkCountryOnBrands',
    {
      http: {path: '/_checkCountryOnBrands'},
      accepts: {arg: 'country', type: 'string', required: true},
      returns: {arg: 'country', type: 'string'}
    }
  );

  // IMPORT
  Brand._import = function(fileData, requiredColumns, externalParams, done) {
    var Category = Brand.app.models.Category,
        Subcategory = Brand.app.models.Subcategory,
        Container = Brand.app.models.Container,
        BrandsByCountries = Brand.app.models.BrandsByCountries,
        dirPath = __dirname.replace(/\\/g, '/').replace('/server/models', '/'),
        imagesRootDir = DSConfig.filestorage.root,
        imageSizes = Brand.app.get('images').sizes;

    var createBrandsList = [],
        createSubcategoriesList = {},
        updateBrandsTitlesList = [],
        updateSubcategoriesList = [],
        updateCategoriesList = {},
        bbcBrandsList = [],
        countriesForUpdate = [];

    /*
     * Prepare global requirements
     */
    var requirementsHandler = function() {
      if (!externalParams.countriesList) {
        return importProcessChain();
      }

      BrandsByCountries.findById(externalParams.countriesList.id, function(err, countriesList) {
        if (countriesList) {
          externalParams.countriesList = countriesList;
          countriesForUpdate = externalParams.countriesList.countries.map(function(item) {
            return item.key;
          });
        }

        return importProcessChain();
      });
    }();

    /*
     * Errors handler
     */
    function callError(brandData, message) {
      if (!message) {
        return null
      }

      var error = {};
      error.message = message;

      brandData.brand && (error.title = brandData.brand);

      return error;
    }

    /*
     * Chain: check and accumulate data per item
     */
    var checkAndAccumulateDataWrapper = function(brandData) {
        /*
         * === LVL 2 ===
         */

        // CHECK BRAND
        function brandChecker(callback) {
          var pattern = new RegExp(brandData.brand.replace(/\s*\(.*?\)\s*/g, ''), 'i');
          Brand.find({where: {title: pattern}, include: ['category', 'subcategory']}, function(err, brands) {
            var brandJSON,
              matchBrand,
              matches = false,
              waterfallBrand = {
                newBrand: {
                  id: String(new ObjectID()),
                  state: 'added_by_admin'
                }
              };

            brandData.brand && (waterfallBrand.newBrand.title = brandData.brand);
            brandData.description && (waterfallBrand.newBrand.text = brandData.description);

            if (brands && brands.length) {
              brands.forEach(function(brand) {
                brandJSON = brand.toJSON();

                if (brandJSON.category.title == brandData.category && brandJSON.subcategory.title == brandData.subcategory) {
                  matches = true;
                  matchBrand = brand;
                }
              });
            }

            if (!brands || !matches) {
              return callback(null, waterfallBrand);
            }

            waterfallBrand.brand = matchBrand;
            callback(null, waterfallBrand)
          });
        }

        // FIND CATEGORY
        function categoryFinder(waterfallBrand, categoryCallback) {
          var pattern = new RegExp(brandData.category, 'i');
          Category.findOne({where: {title: pattern}}, function(err, category) {
            if (err || !category) {
              var error = 'Category not found';
              categoryCallback(null, {error: callError(brandData, error)});
            } else {
              waterfallBrand.newBrand.categoryId = category.id;
              categoryCallback(null, waterfallBrand);
            }
          });
        }

        // FIND SUBCATEGORY
        function subcategoryFinder(waterfallBrand, subcategoryCallback) {
          if (waterfallBrand.error) {
            return subcategoryCallback(null, waterfallBrand);
          }

          var pattern = new RegExp(brandData.subcategory, 'i');
          Subcategory.findOne({where: {title: pattern}}, function(err, subcategory) {
            if (!subcategory) {
              var subcatPseudoName = brandData.subcategory.replace(' ', '').toLowerCase(),
                brandId = String(waterfallBrand.newBrand.id),
                newSubcategory = {
                  id: String(new ObjectID()),
                  title: brandData.subcategory,
                  parentId: waterfallBrand.newBrand.categoryId,
                  brands: [brandId]
                };

              if (!createSubcategoriesList[subcatPseudoName]) {
                createSubcategoriesList[subcatPseudoName] = newSubcategory;
              } else if (createSubcategoriesList[subcatPseudoName].brands.indexOf(brandId) === -1) {
                createSubcategoriesList[subcatPseudoName].brands.push(brandId);
              }

              waterfallBrand.newBrand.subcategoryId = createSubcategoriesList[subcatPseudoName].id;
            } else {
              waterfallBrand.subcategory = subcategory;
              waterfallBrand.newBrand.subcategoryId = subcategory.id;
            }

            subcategoryCallback(null, waterfallBrand);
          });
        }

        // DOWNLOAD / WRITE / RESIZE IMAGE
        function imageGetter(waterfallBrand, imgCallback) {
          if (waterfallBrand.error) {
            return imgCallback(null, waterfallBrand);
          }

          var immCB = function(callback) {
            var getImage = function(imgUrl) {
              if (waterfallBrand.brand && !externalParams.rewriteImages || !imgUrl) {
                return callback(null, waterfallBrand);
              }

              var nowTime = new Date().getTime(),
                  nowTimePart = String(nowTime).slice(7),
                  imgSplit = imgUrl.split('/'),
                  fileFormat = imgSplit[imgSplit.length - 1].split('?')[0].split('.')[1] || 'jpg',
                  fileName = 'b-' + Math.floor(Math.random() + Number(nowTimePart) * 100000).toString(36) + nowTimePart + '.' + fileFormat,
                  imagePath = '/Containers/brands/download/' + fileName;

              function finalCallback(err, path) {
                /*if (err || !path) {
                  var error = 'Image streaming failed (' + err + ')';
                  callback(null, {error: callError(brandData, error)});
                } else {
                  waterfallBrand.newBrand.image = path;
                  callback(null, waterfallBrand);
                }*/

                if (err) {
                  var removeImgPath = dirPath + imagesRootDir + '/brands/' + fileName;

                  setTimeout(function() {
                    fs.unlink(removeImgPath, function(err, data) {
                      console.warn('Image my path `' + removeImgPath + '` was removed');
                    });
                  }, 1000 * 3);
                } else if (path) {
                  waterfallBrand.newBrand.image = path;
                }

                callback(null, waterfallBrand);
              }

              var getRemoteImage = function(streamCb) {

                var stream = request
                  .get(imgUrl)
                  .on('response', function(response) {})
                  .on('error', function(err) { streamCb('Unable to download image'); })
                  .pipe(Brand.app.models.Container.uploadStream('brands', fileName));

                stream.on('finish', function() {
                  var resizeTasks = [],
                      taskFailed = false;

                  Object.keys(imageSizes).forEach(function(sizeName, uploadImgIndex) {
                    var containerName = sizeName ? ('brands_' + sizeName) : 'brands';

                    var resizeTask = function (resizeCb) {
                      if (taskFailed) {
                        return;
                      }

                      GM(dirPath + imagesRootDir + '/brands/' + fileName)
                        .resize(imageSizes[sizeName][0], imageSizes[sizeName][1])
                        .write(dirPath + imagesRootDir + '/' + containerName + '/' + fileName, function (err) {
                          taskFailed = true;
                          resizeCb(err);
                        });
                    };

                    resizeTasks.push(resizeTask)
                  });

                  async.parallel(resizeTasks, function(err, result) {
                    streamCb(err, imagePath);
                  });
                });

              }(finalCallback);

            }(brandData.link);
          }(imgCallback);
        }

      // tasks list
      return [brandChecker, categoryFinder, subcategoryFinder, imageGetter];
    };

    function importProcessChain() {
      async.parallel(fileData.map(function(brandData) {
        /*
         * === LVL 1 ===
         */
        return function(brandCallback) {

          // CHECK REQUIRED COLUMNS
          if (requiredColumns) {
            var notExistsColumnsArr = [],
              noExistsColumns = requiredColumns.reduce(function (prevValue, currentValue) {
                var condition = Object.keys(brandData).indexOf(currentValue) !== -1;

                if (!condition) {
                  notExistsColumnsArr.push(currentValue);
                }

                return prevValue && Object.keys(brandData).indexOf(currentValue) !== -1;
              }, true);

            if (!noExistsColumns) {
              var error = 'There are no required fields (' + notExistsColumnsArr.join(', ') + ')';
              return brandCallback(null, {error: callError(brandData, error)});
            }
          }

          async.waterfall(checkAndAccumulateDataWrapper(brandData), function(err, result) {
            /*
             * === LVL 3 ===
             */
            /* CREATE BRAND */
            var createBrand = function(newBrandData) {
              if (countriesForUpdate) {
                newBrandData.countries = countriesForUpdate;
              }

              var updateSubcategory = {
                id: newBrandData.subcategoryId,
                brandId: newBrandData.id
              };

              // BBC LIST
              createBrandsList.push(newBrandData);
              //
              updateSubcategoriesList.push(updateSubcategory);

              brandCallback(null, {title: newBrandData.title, type: 'create'});
            };

            /*
             ** UPDATE BRAND
             */
            var updateBrand = function(brand, updateBrandData) {
              var updateData = {};

              function brandUpdater() {
                brand.updateAttributes(updateData, function(err, instance) {
                  if (err) {
                    brandCallback(null, {error: callError(brandData, err.message ? err.message : 'Updating brand failed')})
                  } else {
                    brandCallback(null, {id: brand.id, type: 'update'});
                  }
                });
              }

              if (updateBrandData.text && brand.text !== updateBrandData.text) {
                updateData.text = updateBrandData.text
              }

              if (updateBrandData.image && brand.image !== updateBrandData.image) {
                updateData.image = updateBrandData.image
              }

              if (countriesForUpdate) {
                var countries = [];

                countriesForUpdate.forEach(function(country) {
                  if (brand.countries.indexOf(country) === -1) {
                    countries.push(country);
                  }
                });

                if (countries.length) {
                  updateData.countries = brand.countries.concat(countries);
                }
              }

              // BBC LIST
              if (externalParams.countriesList.brands.indexOf(brand.title) === -1 && updateBrandsTitlesList.indexOf(brand.title) === -1) {
                updateBrandsTitlesList.push(brand.title);
              }

              // NO UPDATE DATA
              if (!Object.keys(updateData).length) {
                return brandCallback(null, {id: brand.id, type: 'noUpdate'});
              }

              if (brand.image && updateData.image) {
                // DESTROY PREV IMAGES
                var imageParts = brand.image.split('/'),
                    container = imageParts[imageParts.length - 3],
                    prevImage = imageParts[imageParts.length - 1],
                    sizes = Object.assign({}, imageSizes);

                sizes[''] = null;

                async.parallel(Object.keys(sizes).map(function(sizeName) {
                  return function(destroyImgCb) {
                    Container.removeFile(sizeName ? (container + '_' + sizeName) : container, prevImage, function(err) {
                      destroyImgCb()
                    });
                  }
                }), function(err, resulst) {
                  // UPDATE WITH IMAGE
                  brandUpdater();
                });
              } else {
                // UPDATE WITHOUT IMAGE
                brandUpdater();
              }
            };

            /* INIT BRAND CONSTRUCTOR */
            if (result && result.newBrand && Object.keys(result.newBrand)) {
              var newBrand = {};

              Object.keys(result.newBrand).forEach(function(key) {
                newBrand[key] = result.newBrand[key];
              });

              if (result.brand) {
                // UPDATE BRAND
                updateBrand(result.brand, newBrand)
              } else {
                // CREATE BRAND
                createBrand(newBrand)
              }
            } else {
              // EXCEPTION
              var error = result.error && result.error.message ? result.error.message : 'Unexpected exception';
              return brandCallback(null, {error: callError(brandData, error)});
            }
          });
        }
      }), function(err, results) {
        /*
         * === LVL 4 ===
         */
        var promiseBBC = new Promise(function(resolve, reject) {
          if (!externalParams.countriesList || (!createBrandsList.length && !updateBrandsTitlesList.length)) {
            return resolve();
          }

          var createCountryList = createBrandsList.map(function(brand) { return brand.title });

          bbcBrandsList = externalParams.countriesList.brands.concat(createCountryList, updateBrandsTitlesList);

          BrandsByCountries.updateAll({id: externalParams.countriesList.id || 'ghost'}, {brands: bbcBrandsList}, function() {
            resolve();
          });
        });

        promiseBBC
          .then(function() {
            if (createBrandsList.length) {
              brandsCreateList();
            } else {
              done(null, results);
            }
          })
          .catch(function() {
            done(null, results);
          });

        /********
         ** BRAND`s CREATE LIST
         ********/
        function brandsCreateList() {
          // MASSIVE CREATE BRANDS LIST
          Brand.create(createBrandsList, function(err, brandsInstances) {
            // MASSIVE CREATE SUBCATEGORIES LIST
            function createSubcategories(subcategoriesList, callback) {
              var subcategoriesArr = Object.keys(subcategoriesList).map(function(key) {
                !updateCategoriesList[subcategoriesList[key].parentId] && (updateCategoriesList[subcategoriesList[key].parentId] = []);

                if (updateCategoriesList[subcategoriesList[key].parentId].indexOf(subcategoriesList[key].id) === -1) {
                  updateCategoriesList[subcategoriesList[key].parentId].push(subcategoriesList[key].id);
                }

                return subcategoriesList[key];
              });

              Subcategory.create(subcategoriesArr, function(err, subcategories) {
                if (err) {
                  return callback();
                }

                // UPDATE CATEGORIES FOR NEW SUBCATEGORIES
                async.parallel(Object.keys(updateCategoriesList).map(function(categoryId) {
                  return function(cb) {
                    Category.findById(categoryId, function(err, category) {
                      if (err || !category) {
                        return cb();
                      }

                      var subcategories = category.subcategories.concat(updateCategoriesList[categoryId]);

                      category.updateAttribute('subcategories', subcategories, function(err, categoryInstance) {
                        if (err) {
                          cb(null, {error: {title: categoryId, message: err && err.message ? err.message : 'Unexpected `category` updating error'}});
                        } else {
                          cb();
                        }
                      });
                    });
                  }
                }), function(err, results) {
                  callback(null, results);
                });
              });
            }

            // MASSIVE UPDATE SUBCATEGORIES LIST
            function updateSubcategories(subcategoriesList, callback) {
              var filteredSubcategoriesList = {};

              subcategoriesList.forEach(function(subcategory) {
                if (!filteredSubcategoriesList[subcategory.id]) {
                  filteredSubcategoriesList[subcategory.id] = {
                    id: subcategory.id,
                    brands: [subcategory.brandId]
                  };
                } else if (filteredSubcategoriesList[subcategory.id].brands.indexOf(subcategory.brandId) === -1) {
                  filteredSubcategoriesList[subcategory.id].brands.push(subcategory.brandId);
                }
              });

              async.parallel(Object.keys(filteredSubcategoriesList).map(function(subcategoryId) {
                return function(callback) {
                  Subcategory.findById(subcategoryId, function(err, subcategory) {
                    if (err || !subcategory) {
                      return callback();
                    }

                    var brandsList = subcategory.brands.concat(filteredSubcategoriesList[subcategoryId].brands);

                    subcategory.updateAttribute('brands', brandsList, function(err, subcategoryInstance) {
                      if (err) {
                        callback(null, {error: {title: filteredSubcategoriesList[subcategoryId].title, message: err && err.message ? err.message : 'Unexpected updating error'}});
                      } else {
                        callback();
                      }
                    });
                  });
                }
              }), function(err, subcatResult) {
                var results = subcatResult.filter(function(item) { return item });
                callback(null, results);
              });
            }

            // INIT
            var tasks = [],
                task;

            if (Object.keys(createSubcategoriesList).length) {
              task = function(createSubCb) {
                createSubcategories(createSubcategoriesList, createSubCb);
              };
              tasks.push(task);
            }
            if (updateSubcategoriesList.length) {
              task = function(updateSubCb) {
                updateSubcategories(updateSubcategoriesList, updateSubCb);
              };
              tasks.push(task);
            }
            if (tasks.length) {
              async.parallel(tasks, function(err, asResults) {
                asResults = asResults.filter(function(item) { return item && item.length !== 0 });
                done(null, {imported: results.concat(asResults), bbcList: bbcBrandsList});
              });
            } else {
              done(null, {imported: results, bbcList: bbcBrandsList});
            }
          });
        }

      });
    }
  };

  Brand.remoteMethod(
    '_import',
    {
      http: {path: '/_import'},
      accepts: [
        {arg: 'fileData', type: 'object', required: true},
        {arg: 'requiredColumns', type: 'array', required: false},
        {arg: 'externalParams', type: 'object', required: false}
      ],
      returns: {arg: 'status', type: 'object'}
    }
  );

};
