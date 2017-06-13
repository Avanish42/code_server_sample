(function (angular) {
  'use strict';

  angular
    .module('application', [
      'ui.router',
      'ngResource',
      'lbServices',
      'ui.bootstrap',
      'ngAnimate',
      'angularMoment',
      'angularUtils.directives.dirPagination',
      'toggle-switch',
      'ngFileUpload',
      'mgr.validation',
      'ui-notification',
      'ngTable',
      '$helpers',
      '$user',
      '$userInfo',
      '$filterManage',
      '$createBrand',
      '$createUser',
      '$importBrands',
      '$saveAfterEditBrand',
      '$saveAfterEditUser',
      '$validationRules',
      'application.config',
      'application.header',
      'application.signIn',
      'application.signInForm',
      'application.notFound',
      'application.editProfile',
      'application.editProfileCtrl',
      'application.unexpectedError',
      'application.manageReviews',
      'application.manageReviewsCtrl',
      'application.manageBrands',
      'application.manageBrandsCtrl',
      'application.manageBrandsByCountries',
      'application.manageBrandsByCountriesCtrl',
      'application.manageUsers',
      'application.manageUsersCtrl',
      'application.modalAddUserCtrl',
      'application.modalScreenBrandCtrl',
      'application.modalAddBrandCtrl',
      'application.modalCommentsCtrl',
      'application.modalRejectBrandCtrl',
      'application.modalAddBByCCtrl',
      'application.modalImportBrandsCtrl',
      'application.announcements',
      'application.announcementsCtrl',
      'application.featuredBrands',
      'application.suggestedBrands',
      'application.suggestedBrandsCtrl',
      'application.trendingBrands',
      'application.resetPassword',
      'application.resetPasswordForm',
      'application.resetPasswordRequest',
      'application.resetPasswordRequestForm',
      'application.statusWall',
      'application.notificationSettings'
    ])
    .config(config)
    .constant('serverHost', '{{SERVER_HOST}}')
    .run(run);

  config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider', 'LoopBackResourceProvider', '$httpProvider',  'config', 'serverHost'];
  function config($stateProvider, $urlRouterProvider, $locationProvider, LoopBackResourceProvider, $httpProvider, config, serverHost) {
    LoopBackResourceProvider.setAuthHeader('X-Access-Token');
    LoopBackResourceProvider.setUrlBase(serverHost + config.restApiRoot);

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });

    $httpProvider.interceptors.push(function ($rootScope, $q, LoopBackAuth, $location) {
      return {
        responseError: function (rejection) {
          if (rejection.status == 401) {
            $rootScope.$broadcast('status-401', rejection);
            delete $rootScope.userInfo;
            LoopBackAuth.clearUser();
            LoopBackAuth.clearStorage();
          } else if (rejection.status == 404) {
            if (rejection.data.error.code === 'MODEL_NOT_FOUND') {
              LoopBackAuth.clearUser();
              LoopBackAuth.clearStorage();
              $location.nextAfterLogin = $location.path();
            }
          } else if (rejection.status == 422) {
            $rootScope.$broadcast('status-422', rejection);
          } else if (rejection.status == -1) {
            $location.path('/unexpected-error', rejection);
          }
          return $q.reject(rejection);
        }
      };
    });

    $stateProvider
      .state('application', {
        url: '/',
        templateUrl: 'application/application.html'
      });
    $urlRouterProvider.otherwise('not-found');
  }

  function run($rootScope, $state, $user, $userInfo) {
    $rootScope.$on('$stateChangeSuccess', function(event, toState){
      $rootScope.stateActive = toState.name;

      // Ger user access (roles)
      $userInfo.getUserInfo()
        .then(function(userInfo) {
          if (!userInfo && $state.current.accessRoles) {
            $state.go('application.signIn');
            return;
          }

          var hasAccess = false;
          $rootScope.userInfo = userInfo;

          // Check access for current state
          if ($state.current.accessRoles) {
            userInfo.roles.forEach(function(role) {
              if ($state.current.accessRoles.indexOf(role) !== -1) {
                hasAccess = true;
              }
            });
          }

          // Need state access, but user has incorrect access
          if ($state.current.accessRoles && !hasAccess) {
            $user.logout();
            $state.go('application.signIn');
          }

          // Default home redirect
          if ($state.current.name === '' || $state.current.name === 'application' || $state.current.name === 'application.signIn') {
            if (userInfo) {
              $state.go('application.manageReviews');
            } else {
              $state.go('application.signIn');
            }
          }
        });

    });
  }

})(angular);
