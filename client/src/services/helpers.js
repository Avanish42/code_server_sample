(function (angular) {

  'use strict';

  angular
    .module('$helpers', [])
    .service('$helpers', helpers);

  function helpers() {
    var helper = {};

    helper.capitalizeFirstLetter = function(string) {
      if (!string) {
        return;
      }

      var stringParts = string.split(' '),
          stringFormatted = '';

      stringParts.forEach(function(stringPart, index) {
        stringFormatted !== 0 && (stringFormatted += ' ');
        stringFormatted += (stringPart.charAt(0).toUpperCase() + stringPart.slice(1)).replace(/_/g, ' ');
      });

      return stringFormatted;
    };

    helper.handlerResponseError = function(err, cb) {
      if (err.data && err.data.error && err.data.error.message) {
        cb();
      } else {
        alert(JSON.stringify(err));
      }
    };

    return helper;
  }

})(angular);
