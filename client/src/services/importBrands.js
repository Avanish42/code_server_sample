(function (angular) {

  'use strict';

  angular
    .module('$importBrands', [])
    .service('$importBrands', importBrands);

  function importBrands($rootScope, $q, Brand, config) {
    var init = function(externalParams) {
      var createSum = 0,
          updateSum = 0,
          errorsSum = 0;

      /********
       ** PREPARE FORMATTED IMPORT DATA
       ********/
      var prepareData = function(data) {
        // progress start
        externalParams.importProgress.pt = 10;

        var workbook = window.XLSX.read(data, {type: 'binary'}),
            columnScheme = {},
            imports = {},
            importsAll =[];

        Object.keys(workbook.Sheets).forEach(function(pageName, pageIndex) {
          Object.keys(workbook.Sheets[pageName]).forEach(function(cellName, cellIndex) {

            if (cellName.substr(1) === '1') {
              typeof columnScheme[pageName] !== 'object' && (columnScheme[pageName] = {});
              typeof imports[pageName] !== 'object' && (imports[pageName] = {});
              columnScheme[pageName][cellName.charAt(0)] = workbook.Sheets[pageName][cellName].h.toLowerCase();
            } else if (typeof imports[pageName] === 'object') {
              typeof imports[pageName][cellName.substr(1)] !== 'object' &&(imports[pageName][cellName.substr(1)] = {});
              imports[pageName][cellName.substr(1)][columnScheme[pageName][cellName.charAt(0)]] = workbook.Sheets[pageName][cellName].v;
            }
          });
        });

        // CHECK COLUMNS FORMAT
        var checkInfo = checkDataFormat(columnScheme);
        //
        if (!checkInfo.valid) {
          var errMsg = config.import.brands.errorMessages.columnFormat[0] + config.import.brands.availableColumns.join(', ') + config.import.brands.errorMessages.columnFormat[1];

          if (checkInfo.errors) {
            Object.keys(checkInfo.errors).forEach(function(errorType) {

              if (checkInfo.errors[errorType].length) {
                if (errorType === 'available') {
                  errMsg += (' Excess columns - ' + checkInfo.errors[errorType].join(' ') + '.\n');
                } else if (errorType === 'required') {
                  errMsg += (' Not exists - ' + checkInfo.errors[errorType].join(' ') + '.\n');
                }
              }

            });
          }
          // progress error
          externalParams.importProgress.pt = 100;
          externalParams.errors.upload.push('Incorrect file structure');
          externalParams.errors.import.push(errMsg);
          externalParams.$scope.$apply();

          return;
        }
        //
        if (!imports || !Object.keys(imports).length) {
          externalParams.importProgress.pt = 100;
          externalParams.errors.upload.push('File is empty');
          externalParams.$scope.$apply();

          return;
        }

        Object.keys(imports).forEach(function(pageName) {
          Object.keys(imports[pageName]).forEach(function(cellName) {
            importsAll.push(imports[pageName][cellName]);
          });
        });

        formattingData(importsAll);
      };


      /********
       ** CHECK DATA FORMAT
       *******/
      function checkDataFormat(schema) {
        var errors = {
              available: [],
              required: []
            };

        Object.keys(schema).forEach(function(pageName) {
          // check per page correct column title
          Object.keys(schema[pageName]).forEach(function(currentValue) {
            if (config.import.brands.availableColumns.indexOf(schema[pageName][currentValue]) === -1) {
              errors.available.push('(page `' + pageName + '`, column `' + schema[pageName][currentValue] + '`)');
            }
          });
          // check per page required column title
          var schemaRequiredArr = [];

          Object.keys(schema[pageName]).forEach(function(columnTitle) {
            if (config.import.brands.availableColumns.indexOf(schema[pageName][columnTitle]) !== -1 && schemaRequiredArr.indexOf(schema[columnTitle]) === -1) {
              schemaRequiredArr.push(schema[pageName][columnTitle]);
            }
          });

          if (schemaRequiredArr.length !== config.import.brands.availableColumns.length) {
            var notExistsArr = [];

            config.import.brands.availableColumns.forEach(function(ruleColumnTitle) {
              if (schemaRequiredArr.indexOf(ruleColumnTitle) === -1) {
                notExistsArr.push(ruleColumnTitle);
              }
            });

            if (notExistsArr.length) {
              errors.required.push('(page `' + pageName + '`, column `' + notExistsArr.join(' ,') + '`)');
            }
          }
        });

        return {valid: !errors.available.length && !errors.required.length, errors: errors};
      }


      /********
       ** FORMATTING DATA FOR SERVER
       ********/
      function formattingData(importsAll, sliceIndex) {
        var elOnPage = config.import.brands.onRequest;

        !sliceIndex && (sliceIndex = elOnPage);
        sendData({imports: importsAll.slice(importsAll <= elOnPage ? 0 : sliceIndex - elOnPage, sliceIndex), importsAll: importsAll, sliceIndex: sliceIndex});
      }


      /********
       ** SEND DATA ON SERVER
       *******/
      function sendData(params) {
        var elOnPage = config.import.brands.onRequest,
            resParams = {
              countriesList: externalParams.list,
              rewriteImages: externalParams.rewriteImages
            },
            eachStepFnc = function(err, response) {
              if (err) {
                // progress error
                externalParams.errors.import.push(err.message ? err.message : JSON.stringify(err));
              }

              // progress response
              if (response && response.status) {
                // imported brands
                response.status.imported && response.status.imported.forEach(function(importStatus, statusIndex) {
                  if (!importStatus.error) {
                    if (importStatus.type === 'create') {
                      createSum++;
                    } else if (importStatus.type === 'update') {
                      updateSum++;
                    }
                  } else {
                    externalParams.errors.import.push((importStatus.error.title ? importStatus.error.title + ': ' : 'Unknown: ') + importStatus.error.message);
                    errorsSum++
                  }
                });
                // error catcher
                response.status.length && response.status.forEach(function(importStatus) {
                  if (importStatus.error) {
                    externalParams.errors.import.push((importStatus.error.title ? importStatus.error.title + ': ' : 'Unknown: ') + importStatus.error.message);
                    errorsSum++
                  }
                });

                // UPDATE LIST
                if (response.status.bbcList) {
                  externalParams.list.brands = response.status.bbcList;
                }
              }

              //
              if (params.sliceIndex < params.importsAll.length) {
                var percent = Math.floor((params.imports.length / params.importsAll.length) * 100),
                  percentIncrement = externalParams.importProgress.pt + percent < 100 ? percent : 0;

                formattingData(params.importsAll, params.sliceIndex += elOnPage);
                externalParams.importProgress.pt += percentIncrement;
              } else {
                externalParams.importProgress.pt = 100;
                externalParams.messages.push(createSum + ' brands were imported.');
                externalParams.messages.push(updateSum + ' brands were updated.');
                externalParams.messages.push(errorsSum + ' brands were not imported.');
                externalParams.cb();
              }
            };

        Brand._import({fileData: params.imports, requiredColumns: config.import.brands.requiredColumns, externalParams: resParams},
          function(response) {
            eachStepFnc(null, response);
          },
          function(err) {
            eachStepFnc(err);
          }
        );

      }


      // GET DATA FROM FILE
      readAsBinaryString(externalParams.fileData, prepareData);
    };

    /*******
     ** SUPPORT FNCs
     *******/
    // IE `readAsBinaryString` issue
    function readAsBinaryString(file, callback) {
      var reader = new FileReader();
      if(typeof reader.readAsBinaryString === 'function') {
        reader.readAsBinaryString(file);
        reader.onload = function(e) {
          callback(e.target.result);
        };
      } else {
        reader.addEventListener('loadend', function () {
          var binary = '';
          var bytes = new Uint8Array(reader.result);
          var length = bytes.byteLength;
          for (var i = 0; i < length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          callback(binary);
        });
        reader.readAsArrayBuffer(file);
      }
    }

    return init;
  }

})(angular);
