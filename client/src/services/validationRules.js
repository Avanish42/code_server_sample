(function (angular) {

  'use strict';

  angular
    .module('$validationRules', [])
    .service('$validationRules', validationRules);

  function validationRules(config) {
    var validators = {};

    //
    validators.email = [
      {
        message: 'Email is totally required.',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'Email should match myuser@domain.name pattern',
        rule: function (form, field) {
          if (!field) {
            return false;
          }
          return field.$viewValue && field.$error.pattern;
        }
      }
    ];

    //
    validators.username = [
      {
        message: 'Username is totally required.',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'Use letters and numbers (a-Z0-9) only please',
        rule: function (form, field) {
          return field.$error.pattern;
        }
      },
      {
        message: 'Username must be longer than ' + config.validation.user.username.minLength + ' characters.',
        rule: function (form, field) {
          return field.$error.minlength;
        }
      },
      {
        message: 'Username must be less than ' + config.validation.user.username.maxLength + ' characters.',
        rule: function (form, field) {
          return field.$error.maxlength;
        }
      }
    ];

    //
    validators.firstName = [
      {
        message: 'FirstName is totally required.',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'FirstName must be less than ' + config.validation.user.username.maxLength + ' characters.',
        rule: function (form, field) {
          return field.$error.maxlength;
        }
      }
    ];

    //
    validators.lastName = [
      {
        message: 'LastName is totally required.',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'LastName must be less than ' + config.validation.user.username.maxLength + ' characters.',
        rule: function (form, field) {
          return field.$error.maxlength;
        }
      }
    ];

    //
    validators.password = [
      {
        message: 'Password is required',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'Password must be longer than ' + config.validation.user.password.minLength + ' characters.',
        rule: function (form, field) {
          return field.$error.minlength;
        }
      }
    ];

    //
    validators.phone = [
      {
        message: 'Phone is totally required.',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'Phone is too short (required prefix symbol `+`, minimum ' + config.validation.user.phone.minLength + ' symbols)',
        rule: function (form, field) {
          return field.$error.minlength;
        }
      },
      {
        message: 'Incorrect phone format (E.164 format: +XXXXXXXXXXX)',
        rule: function (form, field) {
          return field.$error.pattern;
        }
      }
    ];

    //
    validators.brandTitle = [
      {
        message: 'Name is required',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'Name must be longer than ' + config.validation.brand.title.minLength + ' characters.',
        rule: function (form, field) {
          return field.$error.minlength;
        }
      },
      {
        message: 'Name must be less than ' + config.validation.brand.title.maxLength + ' characters.',
        rule: function (form, field) {
          return field.$error.maxlength;
        }
      }
    ];

    //
    validators.brandText = [
      {
        message: 'Text is required',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'Text must be longer than ' + config.validation.brand.text.minLength + ' characters.',
        rule: function (form, field) {
          return field.$error.minlength;
        }
      },
      {
        message: 'Text must be less than ' + config.validation.brand.text.maxLength + ' characters.',
        rule: function (form, field) {
          return field.$error.maxlength;
        }
      }
    ];

    //
    validators.brandsByCountriesTitle = [
      {
        message: 'Name is required',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'Name must be longer than ' + config.validation.brandsByCountries.title.minLength + ' characters.',
        rule: function (form, field) {
          return field.$error.minlength;
        }
      },
      {
        message: 'Name must be less than ' + config.validation.brandsByCountries.title.maxLength + ' characters.',
        rule: function (form, field) {
          return field.$error.maxlength;
        }
      }
    ];

    //
    validators.announcementsText = [
      {
        message: 'Text is totally required.',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      },
      {
        message: 'Text must be less than ' + config.validation.announcements.text.maxLength + ' characters.',
        rule: function (form, field) {
          return field.$error.maxlength;
        }
      }
    ];

    //
    validators.announcementsBrand = [
      {
        message: 'Brand is totally required.',
        rule: function (form, field) {
          return (field.$dirty || form.$submitted) && field.$error.required;
        }
      }
    ];

    return validators;
  }

})(angular);
