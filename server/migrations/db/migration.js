var Promise = require('promise'),
  categories = require('./categories'),
  subcategories = require('./subcategories'),
  brands = require('./brands'),
  reviews = require('./reviews'),
  comments = require('./comments'),
  users = require('./users'),
  usersHistory = require('./usersHistory'),
  roleMapping = require('./roleMapping'),
  achievements = require('./achievements'),
  incomeRanges = require('./incomeRanges'),
  brandsByCountries = require('./brandsByCountries'),
  references = require('./references');

module.exports = {
  up: function (dataSource, next) {
    // CATEGORIES
    var promiseCategories = new Promise(function(resolve, reject) {
      dataSource.models.Category.create(categories, function (err, response) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
    });

    promiseCategories
      .then(function(response) {
        upRoleMapping();
      })
      .catch(function(err) {
        console.log('Migration: creating "Categories" was failed');
        upRoleMapping();
      });

    // SUBCATEGORIES
    /*var upSubcategories = function() {
      var promiseSubcategories = new Promise(function(resolve, reject) {
        dataSource.models.Subcategory.create(subcategories, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseSubcategories
        .then(function(response) {
          upRoleMapping();
        })
        .catch(function(err) {
          console.log('Migration: creating "Subcategories" was failed');
          upRoleMapping();
        });
    };*/

    // BRANDS
    /*var upBrands = function() {
      var promiseBrands = new Promise(function(resolve, reject) {
        dataSource.models.Brand.create(brands, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseBrands
        .then(function(response) {
          upReviews();
        })
        .catch(function(err) {
          console.log('Migration: creating "Brands" was failed');
          upReviews();
        });
    };*/

    // REVIEWS
    /*var upReviews = function() {
      var promiseReviews = new Promise(function(resolve, reject) {
        dataSource.models.Review.create(reviews, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseReviews
        .then(function(response) {
          upUsers();
        })
        .catch(function(err) {
          console.log('Migration: creating "Reviews" was failed');
          upUsers();
        });
    };*/

    // USERS
    /*var upUsers = function() {
      var promiseUsers = new Promise(function(resolve, reject) {
        dataSource.models.UserModel.create(users, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseUsers
        .then(function(response) {
          upRoleMapping();
        })
        .catch(function(err) {
          console.log('Migration: creating "Users" was failed');
          upRoleMapping();
        });
    };*/

    // RoleMapping
    var upRoleMapping = function() {
      var promiseUsers = new Promise(function(resolve, reject) {
        dataSource.models.RoleMapping.create(roleMapping, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseUsers
        .then(function(response) {
          upUsersHistory();
        })
        .catch(function(err) {
          console.log('Migration: creating "RoleMapping" was failed');
          upUsersHistory();
        });
    };

    // USERS
    var upUsersHistory = function() {
      var promiseUsers = new Promise(function(resolve, reject) {
        dataSource.models.UserHistory.create(usersHistory, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseUsers
        .then(function(response) {
          upComments();
        })
        .catch(function(err) {
          console.log('Migration: creating "UsersHistory" was failed');
          upComments();
        });
    };

    // COMMENTS
    var upComments = function() {
      var promiseUsers = new Promise(function(resolve, reject) {
        dataSource.models.Comment.create(comments, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseUsers
        .then(function(response) {
          upAchievements();
        })
        .catch(function(err) {
          console.log('Migration: creating "Comments" was failed');
          upAchievements();
        });
    };

    // ACHIEVEMENT
    var upAchievements = function() {
      var promiseUsers = new Promise(function(resolve, reject) {
        dataSource.models.Achievement.create(achievements, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseUsers
        .then(function(response) {
          upIncomeRanges();
        })
        .catch(function(err) {
          console.log('Migration: creating "Achievement" was failed');
          upIncomeRanges();
        });
    };

    // INCOME RANGES
    var upIncomeRanges = function() {
      var promiseIncomeRanges = new Promise(function(resolve, reject) {
        dataSource.models.IncomeRange.create(incomeRanges, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseIncomeRanges
        .then(function(response) {
          upReferences();
        })
        .catch(function(err) {
          console.log('Migration: creating "Income Ranges" was failed');
          upReferences();
        });
    };

    var upReferences = function() {
      var promiseReferences = new Promise(function(resolve, reject) {
        dataSource.models.Reference.create(references, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseReferences
        .then(function(response) {
          upBrandsByCountries();
        })
        .catch(function(err) {
          console.log('Migration: creating "References" was failed');
          upBrandsByCountries();
        });
    };

    var upBrandsByCountries = function() {
      var promiseReferences = new Promise(function(resolve, reject) {
        dataSource.models.BrandsByCountries.create(brandsByCountries, function (err, response) {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        })
      });

      promiseReferences
        .then(function(response) {
          complete();
        })
        .catch(function(err) {
          console.log('Migration: creating "BrandsByCountries" was failed');
          complete();
        });
    };

    var complete = function() {
      console.log('Migration: process was finished!');
      next();
    }
  },
  down: function (dataSource, next) {
    Promise.all([
      dataSource.models.Reference.deleteAll({}, function (err, reference) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "References" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.BrandsByCountries.deleteAll({}, function (err, brandsByCountries) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "BrandsByCountries" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.Category.deleteAll({}, function (err, category) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "Categories" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.Subcategory.deleteAll({}, function (err, subcategory) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "Subcategories" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.Brand.deleteAll({}, function (err, brand) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "Brands" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.Review.deleteAll({}, function (err, review) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "Reviews" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.Comment.deleteAll({}, function (err, review) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "Comments" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.UserModel.deleteAll({}, function (err, review) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "Users" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.UserHistory.deleteAll({}, function (err, review) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "UsersHistory" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.RoleMapping.deleteAll({}, function (err, review) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "RoleMapping" was failed');
          Promise.reject(err);
        }
      }),
      dataSource.models.Achievement.deleteAll({}, function (err, brand) {
        if (!err) {
          Promise.resolve();
        } else {
          console.log('Migration: removing "Achievements" was failed');
          Promise.reject(err);
        }
      })
    ]).then(function (response) {
      console.log('Migration: remove state is OK');
      next();
    }).catch(function(err) {
      console.log('Migration: remove state is broken');
      next();
    });

  }
};
