var app = require('../server');

module.exports = function(country, cb) {

  var BrandsByCountries = app.models.BrandsByCountries,
      defaultCountry = app.get('availableCountry');


  if (!country) {
    return cb(null, defaultCountry);
  }

  /*
   ** SEARCH BRANDS BY COUNTRY
   */
  BrandsByCountries.find({where: {countries: {elemMatch: {key: country}}}}, function(err, brandsByCountries) {
    if (brandsByCountries && brandsByCountries.length) {
      return cb(null, country);
    }

    cb(null, defaultCountry);
  });

};
