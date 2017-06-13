var p = require('../../package.json'),
   version = p.version.split('.').shift();

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();

  server.set('basePath', server.get('apiUrl')[process.env.NODE_ENV || 'local'] + server.settings.restApiRoot + '/');
  router.get('/', server.loopback.status());
  server.use(router);
};
