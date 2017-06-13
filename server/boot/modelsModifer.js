module.exports = function modelCustomization(server) {

  for (var modelName in server.models) {
    var model = server.models[modelName];

    !model.settings.acls && (model.settings.acls = []);
    model.settings.acls.push(
      { principalType: 'ROLE', permission: 'DENY',  principalId: '$everyone',      property: '*' },
      { principalType: 'ROLE', permission: 'DENY',  principalId: '$owner',         property: 'deleteById' },
      { principalType: 'ROLE', permission: 'ALLOW', principalId: 'administrator',  property: '*' },
      { principalType: 'ROLE', permission: 'ALLOW', principalId: '$owner',         property: '*' },
      { principalType: 'ROLE', permission: 'ALLOW', principalId: 'administrator',  property: 'deleteById' }
    );

    if (modelName === 'RoleMapping') {
      var ObjectID = model.getDataSource().connector.getDefaultIdType();
      model.defineProperty('principalId', { type: ObjectID });
    }
  }
};
