var app = require('../server.js');

module.exports = function(server) {

  var defaultRoles = app.get('defaultRoles'),
      Role = server.models.Role;

  createDefaultRoles();

  function createDefaultRoles() {
    var roleNames = defaultRoles.map(function (role) {
      return role.name;
    });
    Role.find({where: {name: {inq: roleNames}}}, function (err, roles) {

      if (roles && roles.length === roleNames.length) {
        console.info('Roles already exists');
      } else {
        Role.create(defaultRoles, function (err, roles) {
          if (!err) {
            console.log('Roles has been created');
          } else {
            console.log('Roles create process error');
          }
        });
      }

    });
  }
};
