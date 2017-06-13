(function (angular) {

  'use strict';

  angular
    .module('$filterManage', [])
    .service('$filterManage', filterManage);

  function filterManage($q, Category, Subcategory, UserModel, Brand) {

    this.init = function(types) {
      var filter = {};

      types && types.forEach(function(type) {
        //by category
        if (type === 'category') {
          Category.find({}, function(categories) {
            filter.categories = [{id: 0, title: 'All', statusActive: true}];

            categories.length && categories.forEach(function(category) {
              category.statusActive = false;
              filter.categories.push(category);
            });
          });
        } else if (type === 'subcategory') {
          Subcategory.find({}, function(subcategories) {
            filter.subcategories = [{id: 0, title: 'All', statusActive: true}];

            subcategories.length && subcategories.forEach(function(subcategory) {
              subcategory.statusActive = false;
              filter.subcategories.push(subcategory);
            });
          });
        } else if (type === 'checked') {
          filter.checked = false;
        } else if (type === 'rejected') {
          filter.rejected = false;
        } else if (type === 'state') {
          filter.states = [{title: 'all'}, {title: 'rejected'}, {title: 'new'}, {title: 'accepted'}, {title: 'added by admin'}];
        }

      });

      filter.change = function(type, model, filterSource) {
        var deferred = $q.defer(),
            hasPing = 0;
        !filterSource && (filterSource = {});

        if (type === 'category') {
          if (model.id) {
            filterSource.categoryId = model.id;
          } else {
            delete filterSource.categoryId;
          }
        } else if (type === 'subcategory') {
          if (model.id) {
            filterSource.subcategoryId = model.id;
          } else {
            delete filterSource.subcategoryId;
          }
        } else if (type === 'checked') {
          if (model) {
            filterSource.status = 1;
          } else {
            delete filterSource.status;
          }
        } else if (type === 'rejected') {
          if (model) {
            filterSource.state = 'rejected';
          } else {
            delete filterSource.state;
          }
        } else if (type === 'state') {
          filterSource.state = model.title.replace(/\s/g, '_');
          if (model.title === 'all') {
            delete filterSource.state;
          }
        } else if (type === 'search') {
          if (model && model.value && model.title && model.title.length) {
            var pingClosed = 0;
            filterSource.or = [];

            model.title.forEach(function(title, index) {
              index++;

              //
              if (title === 'username') {
                hasPing++;

                UserModel.find({filter: {where: {username: {regexp: model.value}}}}, function(users) {
                  pingClosed++;

                  if (users && users.length) {
                    var ids = users.map(function (user) {
                      return user.id;
                    });

                    filterSource.or.push({authorId: {inq: ids}});
                  }

                  if (model.title.length === index && hasPing === pingClosed) {
                    deferred.resolve(filterSource);
                  }
                });
              } else if (title === 'brand') {
                hasPing++;

                Brand.find({filter: {where: {title: {regexp: model.value}}}}, function(brands) {
                  pingClosed++;

                  if (brands && brands.length) {
                    var ids = brands.map(function (brand) {
                      return brand.id;
                    });

                    filterSource.or.push({brandId: {inq: ids}});
                  }

                  if (model.title.length === index && hasPing === pingClosed) {
                    deferred.resolve(filterSource);
                  }
                });
              } else {
                var findObj = {};
                findObj[title] = {regexp: model.value};
                filterSource.or.push(findObj);
              }

              if (model.title.length === index && !hasPing) {
                deferred.resolve(filterSource);
              }
            });
          } else if (filterSource.or) {
            delete filterSource.or;
          }
        }

        if (!hasPing) {
          deferred.resolve(filterSource);
        }

        return deferred.promise;
      };

      return filter;
    };

  }

})(angular);
