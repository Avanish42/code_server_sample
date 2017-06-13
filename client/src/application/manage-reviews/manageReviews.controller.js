(function(angular) {
  'use strict';

  angular
    .module('application.manageReviewsCtrl', [])
    .controller('ManageReviewsCtrl', ManageReviewsCtrl);


  function ManageReviewsCtrl($modal, Review, Comment, $filterManage, config, NgTableParams) {
    var vm = this,
        filterBy = {
          categoryId: undefined,
          subcategoryId: undefined,
          status: undefined,
          query: undefined
        };

    vm.filter = $filterManage.init(['category', 'subcategory', 'checked']);
    vm.config = config;
    vm.orderBy = {createdAt: 'desc'};

    /* Prepare Reviews */
    vm.getTableTotal = function (params) {
      var reqParams = {};

      if (params && Object.keys(params).length) {
        reqParams.where = params;
      }

      Review.count(reqParams, function(info) {
        vm.tableParams.total(info.count);
      });
    };

    vm.getTableTotal();
    vm.tableParams = new NgTableParams(
      {
        page: 1,
        count: 5
      },
      {
        total: 0,
        counts: [5, 10, 25, 50],
        getData: function ($defer, params) {
          var sorting = params.sorting() && Object.keys(params.sorting()).length ? params.sorting() : vm.orderBy,
              count = params.count(),
              page = params.page(),

            reqParams = {
              where: filterBy,
              include: [{
                relation: 'user',
                scope: {
                  fields: ['username']
                }
              }, {
                relation: 'brand',
                scope: {
                  fields: ['title']
                }
              }, {
                relation: 'category',
                scope: {
                  fields: ['title']
                }
              }, {
                relation: 'subcategory',
                scope: {
                  fields: ['title']
                }
              }],
              limit: count,
              skip: (page - 1 || 0) * count
            };

          if (sorting && Object.keys(sorting).length) {
            reqParams.order = Object.keys(sorting)[0] + ' ' + sorting[Object.keys(sorting)[0]].toUpperCase();
          }

          Review.find({filter: reqParams}, function(reviews) {
            $defer.resolve(reviews);
          });
        }
      }
    );

    // DYNAMIC CHANGE TABLE CONTENT
    vm.setTableFilter = function(by, value) {
      vm.filter.change(by, value, filterBy).then(function (response) {
        vm.getTableTotal(response);
        vm.tableParams.reload();
      });
    };

    // TOGGLE TEXT
    vm.toggleText = function($e) {
      var target = angular.element($e.target);

      target.toggleClass('glyphicon-plus glyphicon-minus');
      target.parent().toggleClass('show-text');
    };

    // SHOW COMMENTS
    vm.showComments = function(review) {
      if (review.comments.length) {
        Comment.find({filter: {include: 'user', where: {id: {inq: review.comments}}}}, function(comments) {

          $modal.open({
            templateUrl: 'directives/modal-dialog/comments/modalComments.html',
            controllerAs:  'modalCommentsCtrl',
            controller: 'ModalCommentsCtrl',
            resolve: {
              review: function () {
                return review;
              },
              comments: function () {
                return comments;
              }
            }
          });

        });
      }
    };

    // DELETE
    vm.reviewDelete = function(reviewId, $e) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/confirmation/modalConfirmation.html',
        controllerAs: 'modalConfirmationCtrl',
        controller: ModalConfirmationDeleteCtrl,
        resolve: {
          reviewParams: function () {
            return {
              tableParams: vm.tableParams,
              id: reviewId
            };
          }
        }
      });
    };

    // APPROVE
    vm.reviewApprove = function(review, $e) {
      var relations4Save = ['user', 'brand', 'category', 'subcategory'],
          relations = {};

      // Save
      for (var pName in review) {
        if (review.hasOwnProperty(pName) && relations4Save.indexOf(pName) !== -1) {
          relations[pName] = review[pName];
        }
      }

      review.status = !review.status ? 1 : 0;

      Review.prototype$updateAttributes({id: review.id}, {status: review.status},
        function(response) {
          finalStep();
        },
        function(err) {
          vm.errors = ['Save Review process failed'];
          finalStep();
        }
      );

      // Return
      var finalStep = function() {
        for (var pName in relations) {
          if (relations.hasOwnProperty(pName)) {
            review[pName] = relations[pName];
          }
        }
      }
    };
  }


  /*
  // DELETE REVIEW
  */
  function ModalConfirmationDeleteCtrl(Review, $modalInstance, reviewParams) {
    var vm = this;

    vm.title = 'Confirmation';
    vm.context = 'Are you sure want to DELETE the Review by ID: "' + reviewParams.id + '"?';

    //
    vm.ok = function() {
      Review._delete({reviewId: reviewParams.id}, function(err, info) {
        reviewParams.tableParams.reload();
        $modalInstance.close();
      });
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }

})(angular);
