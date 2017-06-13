var app = require('../server.js');

module.exports = function(server) {

  var defaultUsers = app.get('defaultUsers'),
      User = server.models.UserModel,
      UserHistory = server.models.UserHistory,
      RoleMapping = server.models.RoleMapping,
      Role = server.models.Role;

  createDefaultUsers();

  function createDefaultUsers() {
    User.create(defaultUsers.users, function(err, users) {
      if (err) {
        console.info('User already exists');
        return;
      }

      console.log('Created users');

      users.forEach(function(user, userIndex) {
        Role.findOne({where: {name: defaultUsers.roles[userIndex].name}}, function(err, role) {
          role.principals.create({
            principalType: RoleMapping.USER,
            principalId: user.id
          }, function(err, principal) {
            if (err) throw err;
            console.log('Created principal');

            UserHistory.create({userId: user.id}, function(err) {
              if (err) {
                console.info('UserHistory already exists');
                return;
              }
              console.log('Created UserHistory');
            });
          });
        });
      });
    });
  }

};
