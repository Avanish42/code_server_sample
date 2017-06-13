var app = require('../server'),
    p = require('../../package.json'),
    pushConfig = require('../notification/config');

module.exports = function(params) {

  var SystemNotification = app.models.SystemNotification,
      Notification = app.models.Notification,
      PushModel = app.models.Push,
      message = params.message,
      note;

  // BADGE COUNTER
  SystemNotification.count({userId: params.userId || 'ghost', statusBadge: 0}, function(err, count) {
    count = count !== 'undefined' ? count : 0;

    if (params.deviceType === 'ios') {
      message = JSON.parse(params.message);
      note = new Notification({
        expirationInterval: 3600, // Expires 1 hour from now.
        badge: count,
        sound: 'ping.aiff',
        alert: message.text || 'Get notification',
        userData: params.userData,
        messageFrom: p.description
      });
    } else {
      note = new Notification({
        expirationInterval: 3600, // Expires 1 hour from now.
        message: message,
        messageFrom: p.description
      });
    }

    PushModel.notifyById(params.installationId, note, function (err) {
      if (err) {
        return console.error('Cannot notify %j: %s', params.installationId, err.stack);
      }

      console.log('pushing notification to %j', params.installationId);
    });
  });

};
