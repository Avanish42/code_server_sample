var async = require('async'),
    app = require('../server'),
    config = require('../config'),
    p = require('../../package.json'),
    prepareNotify = require('../modules/prepareNotify');

module.exports = function (User) {


  /*
  // PREVENTS
  */
  User.observe('before save', function (ctx, next) {
    var instance = ctx[ctx.instance ? 'instance' : 'currentInstance'];

    if (instance) {
      if (!instance.createdAt) {
        instance.createdAt = new Date().getTime();
        instance.settings.notifications = config.defaultUserSettings.notifications;
      }
      instance.modifiedAt = new Date().getTime();
    }
    next();
  });

  User.observe('persist', function(ctx, next) {
    var instance = ctx.currentInstance;

    if (instance.useValidation) {
      return next('complete');
    }
    User.exists(instance.id, function(err, exists) {
      if (!exists) {
        onCreateSendEmail(instance);
      }
    });
    next();
  });

  User.beforeRemote('prototype.updateAttributes', function (ctx, result, next) {
    var instance = ctx[ctx.instance ? 'instance' : 'currentInstance'];

    if (typeof ctx.req.body.status !== 'undefined' && instance.status !== ctx.req.body.status) {
      var subjectPart, textPart;

      if (ctx.req.body.status > 1) {
        ctx.req.body.status = 0;
      }

      if (!ctx.req.body.status) {
        subjectPart = 'deactivation';
        textPart = 'deactivated';

        User.app.models.AccessTokenModel.destroyAll({userId: instance.id || 'ghost'});
      } else {
        subjectPart = 'activation';
        textPart = 'activated';
      }

      User._trigger('emailSend', {
        state: 'newSystemMsg',
        email: instance.email,
        subject: 'Account ' + subjectPart,
        html: '<p>Your ' + p.name + ' account has been ' + textPart + '</p>'
      });

    }

    next();
  });


  /*
  // VALIDATION
  */
  // USERNAME
  User.validateAsync('username', function (err, done) {
    var instance = this,
        pattern = new RegExp(app.get('validations').username.pattern);

    if (instance.username && !pattern.test(instance.username)) {
      err();
    }

    done();
  }, {message: 'Incorrect username format (available only letters and numbers)'});
  // FIRSTNAME
  User.validateAsync('firstName', function (err, done) {
    var instance = this;

    if (instance.firstName) {
      if (instance.firstName.length > app.get('validations').firstName.max) {
        err();
      }
    }

    done();
  }, {message: 'firstName is too long (max ' + app.get('validations').firstName.max + ' symbols)'});
  //
  //User.validateAsync('firstName', function (err, done) {
  //  var instance = this,
  //      pattern = new RegExp(app.get('validations').firstName.pattern);
  //
  //  if (instance.firstName) {
  //    if (!pattern.test(instance.firstName)) {
  //      err();
  //    }
  //  }
  //
  //  done();
  //}, {message: 'Incorrect firstName format (available only letters and numbers)'});

  // LASTNAME
  User.validateAsync('lastName', function (err, done) {
    var instance = this;

    if (instance.lastName) {
      if (instance.lastName.length > app.get('validations').lastName.max) {
        err();
      }
    }

    done();
  }, {message: 'lastName is too long (max ' + app.get('validations').lastName.max + ' symbols)'});
  //
  //User.validateAsync('lastName', function (err, done) {
  //  var instance = this,
  //      pattern = new RegExp(app.get('validations').lastName.pattern);
  //
  //  if (instance.lastName) {
  //    if (!pattern.test(instance.lastName)) {
  //      err();
  //    }
  //  }
  //
  //  done();
  //}, {message: 'Incorrect lastName format (available only letters and numbers)'});

  // PHONE
  User.validateAsync('phone', function (err, done) {
    var instance = this,
        pattern = /^\+?[1-9]\d{1,14}$/;

    if (instance.phone && !pattern.test(instance.phone)) {
      err();
    }

    done();
  }, {message: 'Incorrect phone format (E.164 format: +XXXXXXXXXXX)'});

  //
  User.validateAsync('phone', function (err, done) {
    var instance = this;

    if (instance.phone && instance.phone.length < app.get('validations').phone.min) {
      err();
    }

    done();
  }, {message: 'phone is too short (required prefix symbol `+`, minimum ' + app.get('validations').phone.min + ' symbols)'});

  User.validatesUniquenessOf('username', {message: 'Username already exists'});
  User.validatesLengthOf('username',     {max: app.get('validations').username.max,        message: {max: 'username is too long (max ' + app.get('validations').username.max + ' symbols)'}});

  User.validatesUniquenessOf('email',    {message: 'Email already exists'});
  User.validatesFormatOf('email',        {with: /^[\w.-]+@[\w.-]+?\.[a-zA-Z]{2,7}$/,    message: 'Incorrect email format'});

  User.validatesLengthOf('password',     {min: app.get('validations').password.min,        message: {min: 'password is too short'}});


  /*
  // EXTEND METHODS
  */
  User._trigger = function(event, params, cb) {
    User.emit(event, params);
    cb && cb(null, 'ok');
  };

  User.remoteMethod(
    '_trigger',
    {
      http: {path: '/trigger'},
      accepts: [
        {arg: 'event', type: 'string', required: true},
        {arg: 'params', type: 'object'}
      ],
      returns: {arg: 'status', type: 'string'}
    }
  );

  //
  User._changeCredentials = function(user, cb) {
    if (!user.id) {
      cb('Id param already exists', null);
      return;
    } else if (!user.email && !user.username && !user.password) {
      cb(err.message || 'Credentials is empty', null);
      return;
    }

    User.findById(user.id, function(err, instance) {
      if (err || !user) {
        cb(err.message || 'User not found', null);
        return;
      }

      user.email && (instance.email = String(user.email));
      user.username && (instance.username = String(user.username));
      user.password && (instance.password = String(user.password));

      instance.save(function(err, instance) {
        if (err) {
          cb(err.message || 'Saving process is failed', null);
          return
        }

        cb(null, instance);
      });
    });
  };

  User.remoteMethod(
    '_changeCredentials',
    {
      http: {path: '/change-credentials'},
      accepts: {arg: 'user', type: 'object', required: true},
      returns: {arg: 'instance', type: 'object'}
    }
  );

  //
  User._resetPasswordRequest = function(email, cb) {
    var AccessTokenModel = app.models.AccessTokenModel;

    User.findOne({where: {email: email}}, function(err, user) {
      if (err || !user) {
        cb('User not found' || null);
        return;
      }

      user.createAccessToken(1000 * 24 * 60 * 60, function(err, token) {
        if (err || !user) {
          cb('Create accessToken is failed', null);
          return;
        }

        AccessTokenModel.destroyAll({userId: user.id, id: {neq: token.id}}, function(err, info) {
          User.emit('emailSend', {
            state: 'resetPasswordRequest',
            email: user.email,
            accessToken: token,
            user: user
          });

          cb(null, 'ok');
        });
      });
    });
  };

  User.remoteMethod(
    '_resetPasswordRequest',
    {
      http: {path: '/reset-password/request'},
      accepts: {arg: 'email', type: 'string', required: true},
      returns: {arg: 'status', type: 'string'}
    }
  );

  //
  User._setPasswordByToken = function(token, password, cb) {
    var AccessTokenModel = app.models.AccessTokenModel;

    AccessTokenModel.findById(token, function(err, token) {
      if (err || !token) {
        cb('Token not found', null);
        return;
      }

      token.user(function(err, user) {
        if (err || !user) {
          cb('User not found', null);
          return;
        }

        user.password = password;
        user.save(function(err, instance) {
          if (err) {
            cb('Password change is failed', null);
          } else {
            token.destroy();
            cb(null, {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              photo: user.photo
            });
          }
        });
      });
    });
  };

  User.remoteMethod(
    '_setPasswordByToken',
    {
      http: {path: '/reset-password/set'},
      accepts: [
        {arg: 'token', type: 'string', required: true},
        {arg: 'password', type: 'string', required: true}
      ],
      returns: {arg: 'user', type: 'object'}
    }
  );

  //
  User._deleteUserRelations = function(id, cb) {
    id = id ? id : 'ghost';
    var destroyData = {};

    User.findById(id, function (err, user) {
      if (err || !user) {
        return cb(err || 'Can`t find User', null);
      }

      User.app.models.Review.destroyAll({authorId: id}, function(err, info) {
        destroyData['review'] = info;

        User.app.models.RoleMapping.destroyAll({principalId: id}, function(err, info) {
          destroyData['roleMapping'] = info;

          User.app.models.AccessTokenModel.destroyAll({userId: id}, function(err, info) {
            destroyData['accessToken'] = info;

            if (user.accountRelations && Object.keys(user.accountRelations).length) {
              return deleteSocialProfiles(user, deleteImage);
            }
            if (user.photo) {
              return deleteImage(user, deleteUser);
            }
            deleteUser(user);
          });
        });
      });
    });


    var deleteSocialProfiles = function (user, callback) {
      id = String(user.id);
      var counter = 0;
      for (var accType in user.accountRelations) {
        if (user.accountRelations.hasOwnProperty(accType)) {
          var accId = user.accountRelations[accType] || 'ghost',
            accTypeName = accType.replace('Id', ''),
            socialName = accTypeName.charAt(0).toUpperCase() + accTypeName.slice(1) + 'Profile',
            ProfileModel = User.app.models[socialName];

          ProfileModel.destroyById(accId, function(err, info) {
            counter++;
            destroyData[socialName] = info;

            if (Object.keys(user.accountRelations).length === counter) {
              callback(user, deleteUser);
            }
          });
        }
      }
    };

    var deleteImage = function (user, callback) {
      id = String(user.id);
      var photoParts = user.photo.split('/download/');

      if (user.photo && photoParts.length) {
        var folderName = photoParts[0].split('/')[photoParts.length],
            fileName = photoParts[1];

        User.app.models.Container.removeFile(folderName, fileName, function(err, info) {
          destroyData['photo'] = info;
          callback(user);
        });
      } else {
        callback(user);
      }
    };

    var deleteUser = function (user) {
      id = String(user.id);
      User.destroyById(id, function(err, info) {
        destroyData['user'] = info;
        cb(err, destroyData);
      });
    }
  };

  User.remoteMethod(
    '_deleteUserRelations',
    {
      http: {path: '/delete/relations', verb: 'delete', required: true},
      accepts: {arg: 'id', type: 'string'},
      returns: {arg: 'result', type: 'object'}
    }
  );

  //
  User._setSystemNotifications = function(params, cb) {
    params.cb = cb;

    prepareNotify(params);

    if (params.to && params.type === 7) {
      var tasks = params.to.map(function(userId) {
        return function(cb) {
          User.findOne({where: {id: userId}, fields: ['email']}, function(err, user) {
            cb(null, user.email || null);
          });
        }
      });

      async.parallel(tasks, function(err, emails) {
        var info = {
          email: emails,
          from: config.email,
          state: 'newSystemMsg',
          subject: 'You got a notification from Brand Beat',
          html: '<p>' + params.text + '</p>'
        };

        User.emit('systemSend', {
          state: params === 7 ? 'announceByBrandbeat' : 'announceByBrand',
          from: params.from,
          image: params.image,
          brandId: params.brandId,
          text: params.text
        });
        User.emit('emailSend', info);
      });
    }
  };

  User.remoteMethod(
    '_setSystemNotifications',
    {
      http: {path: '/set-system-notification'},
      accepts: {arg: 'params', type: 'object', required: true},
      returns: {arg: 'status', type: 'string'}
    }
  );


  // SYSTEM EVENTs
  User.on('systemSend', function (info) {
    var params;

    // Someone now is following the user
    if (info.state === 'newFollower') {
      prepareNotify({
        type: 1,
        userId: info.user.id,
        follower: info.follower
      });
    }
    // Someone liked the user’s review
    if (info.state === 'reviewLike') {
      prepareNotify({
        type: 2,
        userId: info.review.authorId,
        reviewId: info.review.id,
        follower: info.follower
      });
    }
    // Someone commented on the user’s review
    if (info.state === 'reviewComment') {
      prepareNotify({
        type: 3,
        userId: info.review.authorId,
        reviewId: info.review.id,
        follower: info.follower
      });
    }
    // Someone liked the user’s comment
    if (info.state === 'commentLike') {
      params = {
        type: 4,
        userId: info.comment.authorId,
        parentId: info.comment.parentId,
        commentId: info.comment.id,
        follower: info.follower
      };

      prepareNotify(params);
    }
    // Someone replied to the user’s comment
    if (info.state === 'commentReplied') {
      params = {
        type: 5,
        userId: info.comment.authorId,
        parentId: info.comment.parentId,
        commentId: info.comment.onCommentId,
        follower: info.follower
      };

      prepareNotify(params);
    }
    // The user earned an achievement
    if (info.state === 'achievementsAdd') {
      prepareNotify({
        type: 6,
        userId: info.userId,
        achievement: info.achievement
      });
    }
    if (info.state === 'announceByBrandbeat') {
      params = {
        type: 7,
        from: info.from,
        image: info.image,
        text: info.text
      };

      prepareNotify(params);
    }
    if (info.state === 'announceByBrand') {
      params = {
        type: 8,
        from: info.from,
        image: info.image,
        brandId: info.brandId,
        text: info.text
      };

      prepareNotify(params);
    }
    // An admin accepted the brand added by the user
    if (info.state === 'brandAccepted') {
      prepareNotify({
        type: 9,
        userId: info.user.id,
        brand: {
          id: info.brand.id,
          title: info.brand.title,
          image: info.brand.image
        }
      });
    }
    // An admin rejected the brand added by the user
    if (info.state === 'brandRejected') {
      params = {
        type: 10,
        userId: info.user.id,
        brand: {
          id: info.brand.id,
          title: info.brand.title
        },
        reason: info.reason
      };

      if (info.reasonBrand && info.reasonBrand.image) {
        params.reasonBrandImage = info.reasonBrand.image;
      }

      prepareNotify(params);
    }
    // Taged Some User
    if (info.state === 'tagedPost') {
      params = {
        type: 11,
        usersId: info.usersId,
        follower: info.follower
      };

      if (info.review) {
        params.review = info.review;
      }
      if (info.comment) {
        params.comment = info.comment;
      }

      prepareNotify(params);
    }
  });


  // EMAIL EVENTs
  User.on('emailSend', function (info) {
    // OWNER != FOLLOWER
    if (info.user && info.follower && (String(info.user.id) === String(info.follower.id))) {
        return;
    }

    // Reset password on email
    info.state === 'resetPasswordRequest' && resetPasswordSendEmail(info);
    // New Comment On Review
    info.state === 'newCommentOnReview' && newCommentOnReviewSendEmail(info);
    // New Comment On Comment
    info.state === 'newCommentOnComment' && newCommentOnCommentSendEmail(info);
    // New Follower
    info.state === 'newFollower' && newFollowerSendEmail(info);
    // New Achievement
    info.state === 'newAchievement' && newAchievementSendEmail(info);
    // NEW System Message
    info.state === 'newSystemMsg' && newSystemMsgSendEmail(info);
  });


  /*
  // Emails
  */
  // Reset password
  function resetPasswordSendEmail(info) {
    var url = app.get('clientUrl')[process.env.NODE_ENV || 'local'] + '/reset-password',
        html = 'Click <a href="' + url + '?access_token=' + info.accessToken.id + '">here</a> to reset your password';

    User.app.models.Email.send({
      to: info.email,
      from: config.email,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending USER PASSWORD RESET email');
      console.log('> sending USER PASSWORD RESET email to:', info.email);
    });
  }

  // Registration
  function onCreateSendEmail(info) {
   //  var html = '<h1>Registration successful</h1><p>This message is an automated reply to your registration request in ' + config.mainTitle + '.</p>';
    var html = '<!DOCTYPE html><html> <head> <title>'+config.mainTitle+'</title> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <style type="text/css"> *{margin: 0; padding: 0; font-family: Arial, sans-serif;}</style> </head> <body> <table cellpadding="0" cellspacing="0" align="center" style="background: #FFF; width:750px; margin: 0 auto; height:1100px;"> <tr style="padding:0; display:block; vertical-align: top;"> <td colspan="2"> <img src="http://128.199.191.185/assets/images/email/header.png" alt="Bran Beat" width="750"/> </td></tr><tr style="padding:0; display:block; vertical-align: top;"> <td style="padding:20px 20px 10px;"> <p style="font-size: 18px; text-align: left; font-weight: 400; line-height: 20px; color: #333;">Hi '+info.email+'!</p></td></tr><tr style="padding:0; display:block; vertical-align: top;"> <td style="padding:0px 20px 10px;"> <p style="font-size: 18px; text-align: left; font-weight: 400; line-height: 24px; color: #333;">Welcome to BrandBeat! You have joined a community of thousands of brand reviewers across the globe, who review & rate thousands of brands & products.</p></td></tr><tr style="padding:0; display:block; vertical-align: top;"> <td style="padding:0px 20px 10px;"> <p style="font-size: 18px; text-align: left; font-weight: 400; line-height: 24px; color: #333;">BrandBeat is a beta version app that helps you find, review & compare brands and lets you share your story on your daily experiences of thousands of brands that you use. Simple select the categories you want to follow and the brands feed will show you reviews of thousands of brands to browse.</p></td></tr><tr style="padding:0; display:block; vertical-align: top;"> <td style="padding:0px 20px 10px;"> <p style="font-size: 18px; text-align: left; font-weight: 400; line-height: 24px; color: #333;">Our number one tip to get the most out of BrandBeat is to start with reviewing the brands that you use daily. You will not only get to hear stories from other consumers but will also have an impact where it matters.</p></td></tr><tr style="padding:0; display:block; text-align: center; vertical-align: top;"> <td style="padding:25px 20px; text-align: center; display: block;"> <a style="font-size: 18px; text-align: center; text-decoration: underline; font-weight: 400; line-height: 20px; color: #c72349;">To learn more check out our awesome video</a> </td></tr><tr style="padding:0; display:block; vertical-align: top;"> <td style="padding:0px 20px 20px;"> <p style="font-size: 18px; text-align: left; font-weight: 400; line-height: 24px; color: #333;">We love to hear about your experience using the app, especially if you find something that bugs you, so Just shoot us an email! We are always here to help & improve.</p></td></tr><tr style="padding:0; display:block; vertical-align: top;"> <td style="padding:5px 20px;"> <p style="font-size: 18px; text-align: left; font-weight: 700; line-height: 20px; color: #333;">Cheerfully yours,</p><p style="font-size: 18px; text-align: left; font-weight: 400; line-height: 20px; color: #333;">BrandBeat Team</p></td></tr><tr style="padding:0; display:block; vertical-align: top; text-align: center;"> <td style="padding:35px 20px 0; display:block; text-align: center;"> <a href="mailto:info@brand-beat.com" style="color: #c72349;">info@brand-beat.com</a> &nbsp; | &nbsp; <a href="http://brand-beat.com" style="color: #c72349;" target="_blank">www.brand-beat.com</a> </td></tr><tr style="padding:0; display:block; vertical-align: top; text-align: center;"> <td style="padding:15px 20px 0; display:block; text-align: center;"> <a href="#" target="_blank"><img src="http://128.199.191.185/assets/images/email/appstore.png" alt="Apple Store" width="120"/></a> &nbsp; &nbsp; <a href="#" target="_blank"><img src="http://128.199.191.185/assets/images/email/playstore.png" alt="Play Store" width="120"/></a> </td></tr><tr style="padding:0; display:block; vertical-align: top; text-align: center;"> <td style="padding:15px 20px 0; display:block; text-align: center;"> <a href="https://www.facebook.com/brandbeatapp/?ref=bookmarks" target="_blank"><img src="http://128.199.191.185/assets/images/email/fb.png" alt="facebook" width="35"/></a>&nbsp;<a href="https://twitter.com/brandbeatapp" target="_blank"><img src="http://128.199.191.185/assets/images/email/tw.png" alt="Twitter" width="35"/></a> <a href="https://www.instagram.com/brandbeatapp/" target="_blank"><img src="http://128.199.191.185/assets/images/email/insta.png" alt="Instagram" width="35"/></a>&nbsp;<a href="https://www.youtube.com/channel/UCgDCih7AALrpviuIYC_Z3tw" target="_blank"><img src="http://128.199.191.185/assets/images/email/youtube.png" alt="youtube" width="35"/></a> </td></tr><tr style="padding:0; display:block; text-align: center; vertical-align: top;"> <td style="padding:25px 20px; text-align: center; display: block;"> <a style="font-size: 18px; text-align: center; text-decoration: underline; font-weight: 400; line-height: 20px; color: #c72349;" target="_blank">unsubscribe from this list</a> </td></tr></table> </body></html>';

    User.app.models.Email.send({
      to: info.email,
      from: 'newuser@brand-beat.com',
      subject: config.mainTitle + ': Registration notification',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending USER REGISTRATION notification email');
      console.log('> sending USER REGISTRATION notification on email:', info.email);
    });
  }

  // Notification New Comment
  function newCommentOnReviewSendEmail(info) {
    var html = '<p>On your Review has been posted new comment.</p>';

    User.app.models.Email.send({
      to: info.email,
      from: config.email,
      subject: config.mainTitle + ': New comment notification',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending NEW COMMENT notification email');
      console.log('> sending NEW COMMENT notification on email:', info.email);
    });
  }

  // Notification New Comment
  function newCommentOnCommentSendEmail(info) {
    var html = '<p>On your Comment has been posted new comment.</p>';

    User.app.models.Email.send({
      to: info.email,
      from: config.email,
      subject: config.mainTitle + ': New comment notification',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending NEW COMMENT notification email');
      console.log('> sending NEW COMMENT notification on email:', info.email);
    });
  }

  // Notification New Follower
  function newFollowerSendEmail(info) {
    var html = '<p>You have a new follower (' + info.follower.username + ').</p>';

    if (!info.user.settings.notifications.followers.email) {
      return;
    }

    User.app.models.Email.send({
      to: info.email,
      from: config.email,
      subject: config.mainTitle + ': New follower notification',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending NEW FOLLOWER notification email');
      console.log('> sending NEW FOLLOWER notification on email:', info.email);
    });
  }

  // Notification New Achievement
  function newAchievementSendEmail(info) {
    var html = '<p>You have a new achievement (' + info.achievement.title + ').</p>';

    if (!info.user.settings.notifications.achievements.email) {
      return;
    }

    User.app.models.Email.send({
      to: info.email,
      from: config.email,
      subject: config.mainTitle + ': New achievement notification',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending NEW ACHIEVEMENT notification email');
      console.log('> sending NEW ACHIEVEMENT (' + info.achievement.title + ') notification on email:', info.email);
    });
  }

  // Notification New System Message
  function newSystemMsgSendEmail(info) {
    var html = info.html || '<p>' + info.text + '</p>';

    User.app.models.Email.send({
      to: info.email,
      from: config.email,
      subject: config.mainTitle + ': ' + (info.subject || 'You got a notification from ' + p.description),
      html: html
    }, function(err, data) {
      if (err) return console.log('> error sending SYSTEM notification email');
      console.log('> sending SYSTEM notification on email:', data.accepted);
    });
  }
};
