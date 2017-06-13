(function() {

  'use strict';

  var config = {
    restApiRoot: '/api/v1',
    validation: {
      user: {
        username: {
          pattern: /^[a-zA-Z0-9]+$/,
          minLength: 3,
          maxLength: 35
        },
        email: {
          pattern: /^[\w.-]+@[\w.-]+?\.[a-zA-Z]{2,7}$/
        },
        password: {
          minLength: 6
        },
        firstName: {
          maxLength: 35
        },
        lastName: {
          maxLength: 35
        },
        phone: {
          pattern: /^\+?[1-9]\d{1,14}$/,
          minLength: 8
        },
        photo: {
          types: ['jpg', 'png'],
          maxSize: '10MB',
          minWidth: 200,
          minHeight: 200
        }
      },
      brand: {
        title: {
          minLength: 3,
          maxLength: 35
        },
        text: {
          minLength: 6,
          maxLength: 500
        },
        photo: {
          types: ['jpg', 'png'],
          maxSize: '10MB',
          minWidth: 250,
          minHeight: 250
        },
        import: {
          types: ['xlsx']
        }
      },
      brandsByCountries: {
        title: {
          minLength: 3,
          maxLength: 35
        }
      },
      announcements: {
        text: {
          maxLength: 500
        }
      }
    },
    managePages: {
      itemsPerPage: 5
    },
    paths: {
      upload: {
        brand: '/storage/brands/upload',
        user: '/storage/users/upload'
      },
      logoImg: '/Containers/main/download/logo-icon64.png'
    },
    import: {
      brands: {
        onRequest: 30,
        availableColumns: ['brand', 'category', 'subcategory', 'description', 'link'],
        requiredColumns: ['brand', 'category', 'subcategory'],  // 'link'
        errorMessages: {
          columnFormat: ['Columns in the file should be: ', '. Your file doesn`t match. Please check it.']
        }
      }
    }
  };

  /* --------------------------------- */

  angular
    .module('application.config', [])
    .constant('config', config);

})(angular);
