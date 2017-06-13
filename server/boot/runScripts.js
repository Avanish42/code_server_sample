var clearBrandsList = require('../modules/clearBrandsList');

module.exports = function(server) {
  var CLEAR_BRANDS_LIST_ON = process.env.CLEAR_BRANDS_LIST;

  if (CLEAR_BRANDS_LIST_ON) {
    clearBrandsList();
  }
};
