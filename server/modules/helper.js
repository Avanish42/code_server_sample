/*
 ** HELPER FNC`s
 */

'use strict';
var app = require('../server');

//
var mask = function (object, fieldsStr) {

  var fields = fieldsStr.split(',');

  if (!object || !fields || !fields.length) {
    return object;
  }

  var result = {};

  fields.forEach(function (field) {
    var keyValue = field.split('=');
    if (keyValue.length > 1) {
      var valueTyped = keyValue[1].split(':'),
          toType = valueTyped.length > 1 ? valueTyped[1] : null,
          value = valueTyped[0];

      toType === 'number' && (value = Number(value));
      result[keyValue[0]] = value;
    }
    if (typeof object[field] !== 'undefined'/* && object[field] !== null*/) {
      result[field] = object[field];
    }
  });

  return result;

};

//
function capitalizeFirstLetter(letter) {
  return letter.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

//
var glueAbsImgPath = function (relativePath) {
  if (relativePath && relativePath.indexOf('http') === -1) {
    relativePath = relativePath.replace(/^\//, '');
    relativePath = app.get('basePath') + relativePath
  }

  return relativePath;
};

//
var sortBy = function (items, byArr) {

  if (!items || !items.length || !byArr) {
    return items;
  }

  function sort(by) {
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
  }

  return byArr.map(sort)[0];
};


exports.mask = mask;
exports.capitalizeFirstLetter = capitalizeFirstLetter;
exports.glueAbsImgPath = glueAbsImgPath;
exports.sortBy = sortBy;
