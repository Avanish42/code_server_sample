var pushConfig = require('./config');
var p = require('../../package.json');

module.exports = function(app) {

  var Application = app.models.Application,
      PushModel = app.models.Push;

  // Start Server
  startPushServer();
  function startPushServer() {
    var pushApp = {
          id: pushConfig.appName,
          userId: 'strongloop',
          name: pushConfig.appName,
          description: p.name + ' Push Notification Application',
          pushSettings: {
            apns: {
              production: process.env.NODE_ENV === 'production',
              certData: pushConfig.apnsCertData,
              keyData: pushConfig.apnsKeyData,
              pushOptions: {
                port: 2195
                // Extra options can go here for APN
              },
              feedbackOptions: {
                port: 2196,
                batchFeedback: true,
                interval: 300
              }
            },
            gcm: {
              serverApiKey: pushConfig.gcmServerApiKey
            }
          }
        };

    PushModel.on('error', function (err) {
      console.error('Push Notification error: ', err.stack || err === 401 ? 'incorrect request data' : 'unexpected issue');
    });

    updateOrCreateApp(function (err, appModel) {
      if (err) {
        throw err;
      }
      console.log('Application id: %j', appModel.id);
    });


    //--- Helper functions ---

    function updateOrCreateApp(cb) {
      Application.findOne({where: { id: pushApp.id }}, function (err, result) {
        if (err) cb(err);
        if (result) {
          console.log('Updating application: ' + result.id);
          delete pushApp.id;
          result.updateAttributes(pushApp, cb);
        } else {
          return registerApp(cb);
        }
      });
    }

    function registerApp(cb) {
      console.log('Registering a new Application...');
      // Hack to set the app id to a fixed value so that we don't have to change
      // the client settings
      Application.beforeSave = function (next) {
        if (this.name === pushApp.name) {
          this.id = 'loopback-component-push-app';
        }
        next();
      };
      Application.register(
        pushApp.userId,
        pushApp.name,
        {
          description: pushApp.description,
          pushSettings: pushApp.pushSettings
        },
        function (err, app) {
          if (err) {
            return cb(err);
          }
          return cb(null, app);
        }
      );
    }
  }

};
