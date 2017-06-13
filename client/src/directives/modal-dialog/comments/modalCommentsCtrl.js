(function(angular) {
  'use strict';

  angular
    .module('application.modalCommentsCtrl', [])
    .controller('ModalCommentsCtrl', ModalCommentsCtrl);


  function ModalCommentsCtrl($modalInstance, $modal, review, comments) {
    var vm = this;

    vm.title = 'Comments';
    vm.comments = comments;

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };

    // TOGGLE TEXT
    vm.toggleText = function($e) {
      var target = angular.element($e.target);

      target.toggleClass('glyphicon-plus glyphicon-minus');
      target.parent().toggleClass('show-text');
    };

    // DELETE COMMENT
    vm.commentDelete = function(comment, $e) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/confirmation/modalConfirmation.html',
        controllerAs: 'modalConfirmationCtrl',
        controller: ModalConfirmationDeleteCtrl,
        resolve: {
          review: function () {
            return review;
          },
          comment: function () {
            return comment;
          },
          comments: function () {
            return vm.comments;
          },
          $event: function () {
            return $e;
          },
          $parentModalInstance: function () {
            return $modalInstance;
          }
        }
      });
    };

    // SHOW USER
    vm.showUser = function(user) {
      $modal.open({
        templateUrl: 'directives/modal-dialog/add-user/modalAddUser.html',
        controllerAs: 'modalAddUserCtrl',
        controller: 'ModalAddUserCtrl',
        resolve: {
          userParams: function() {
            return {
              tableParams: vm.tableParams,
              user: user
            }
          }
        }
      });
    }
  }


  /*
  // DELETE COMMENT
  */
  function ModalConfirmationDeleteCtrl($modalInstance, Review, review, comment, comments, $event, $parentModalInstance) {
    var vm = this,
        commentsList = [];

    vm.title = 'Confirmation';
    vm.context = 'Are you sure want to DELETE the comment by ID: "' + comment.id + '"?';

    //
    vm.ok = function() {
      var commentRow = angular.element($event.target.closest(".comment-row")),
          relations4Save = ['user', 'brand', 'category', 'subcategory'],
          relations = {};

      comment.$delete(function(info) {
        commentRow.remove();

        comments = comments.filter(function(item) {
          if (item.id !== comment.id) {
            commentsList.push(item.id);
            return item;
          }
        });

        review.comments = commentsList;

        // Save
        for (var pName in review) {
          if (review.hasOwnProperty(pName) && relations4Save.indexOf(pName) !== -1) {
            relations[pName] = review[pName];
          }
        }

        Review.prototype$updateAttributes({id: review.id}, {comments: commentsList},
          function(response) {
            finalStep();
          },
          function(err) {
            finalStep();
            alert(err.data.error.message);
          }
        );

        var finalStep = function() {
          if (!review.comments.length) {
            $parentModalInstance.close();
          }

          // Return
          for (var pName in relations) {
            if (relations.hasOwnProperty(pName)) {
              review[pName] = relations[pName];
            }
          }

          $modalInstance.close();
        };
      });
    };

    //
    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }


})(angular);
