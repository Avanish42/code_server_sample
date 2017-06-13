var app = require('../server'),
    Promise = require('promise'),
    pushConfig = require('../notification/config'),
    notify = require('../modules/notify'),
    helper = require('./helper');

module.exports = function(params) {

  var User = app.models.UserModel,
      SystemNotification = app.models.SystemNotification,
      Installation = app.models.Installation,
      clientUrl = app.get('clientUrl')[process.env.NODE_ENV || 'local'];


  /*
  // CHECK NOTIFICATION DURATION
  */
  var checkNotifyDuration = function() {
    var promiseFindNotify = new Promise(function(resolve, reject) {
      var reqParams = {
        where: {
          createdAt: {gt: (parseInt(new Date().getTime()) - (params.durationDays || 7) * 24 * 60 * 60)}
        }
      };

      // OWNER != FOLLOWER
      if (params.userId && params.follower) {
        if (String(params.userId) === String(params.follower.id)) {
          return reject('Follower is owner');
        }
      }

      // by follower
      if (params.type === 1) {
        reqParams.where.type = params.type;
        reqParams.where['follower.id'] = params.follower.id;
      }
      // by like review
      if (params.type === 2) {
        reqParams.where.type = params.type;
        reqParams.where['reviewId'] = params.reviewId;
        reqParams.where['follower.id'] = params.follower.id;
      }
      // by like comment
      if (params.type === 4) {
        reqParams.where.type = params.type;
        reqParams.where['commentId'] = params.commentId;
        reqParams.where['follower.id'] = params.follower.id;
      }

      if (reqParams.where.type) {
        SystemNotification.find(reqParams, function(err, notifications) {
          if (err) {
            return params.cb(err ? err.message : 'Find System Notification failed', null);
          }
          resolve(notifications);
        });
      } else {
        resolve([]);
      }
    });

    promiseFindNotify
      .then(createNotify)
      .catch(rejectNotify);
  };


  /*
  // CREATE SYSTEM NOTIFICATION
  */
  var createNotify = function(notifications) {
    var promiseCreateNotify = new Promise(function(resolve, reject) {
      var notificationsList = [],
          newNotify = {},
          mask;

      if (params.type === 1 && !notifications.length) {

        // Someone now is following the user;
        mask = 'type,userId,statusRead=0:number,statusBadge=0:number';
        newNotify = helper.mask(params, mask);
        newNotify.follower = helper.mask(params.follower, 'id,photo,username,firstName,lastName');
        newNotify.follower.photo = helper.glueAbsImgPath(newNotify.follower.photo);

      } else if ((2 === params.type || params.type === 3) && !notifications.length) {

        // Someone liked the user’s review
        // Someone commented on the user’s review
        mask = 'type,userId,reviewId,statusRead=0:number,statusBadge=0:number';
        newNotify = helper.mask(params, mask);
        newNotify.follower = helper.mask(params.follower, 'id,photo,username,firstName,lastName');
        newNotify.follower.photo = helper.glueAbsImgPath(newNotify.follower.photo);

      } else if ((params.type === 4 && !notifications.length) || params.type === 5) {

        // Someone liked the user’s comment
        // Someone replied to the user’s comment
        mask = 'type,userId,parentId,commentId,statusRead=0:number,statusBadge=0:number';
        newNotify = helper.mask(params, mask);
        newNotify.follower = helper.mask(params.follower, 'id,photo,username,firstName,lastName');
        newNotify.follower.photo = helper.glueAbsImgPath(newNotify.follower.photo);

      } else if (params.type === 6) {

        // The user earned an achievement
        mask = 'type,userId,achievement,statusRead=0:number,statusBadge=0:number';
        newNotify = helper.mask(params, mask);
        newNotify.achievement.image = helper.glueAbsImgPath(newNotify.achievement.image);

      } else if (7 === params.type || params.type === 8) {

        // The system sent (Admin Panel)
        mask = 'type,from,brandId,text,image,statusRead=0:number,statusBadge=0:number';

        params.to.forEach(function(userId) {
          newNotify = helper.mask(params, mask);
          newNotify.userId = userId;
          notificationsList.push(newNotify);
        });

      } else if (9 === params.type || params.type === 10) {

        // An admin accepted the brand added by the user
        // An admin rejected the brand added by the user
        mask = 'type,brand,userId,reasonBrandId,statusRead=0:number,statusBadge=0:number';
        newNotify = helper.mask(params, mask);
        if (params.reason) {
          newNotify.text = params.reason;
        }
        if (params.reasonBrandImage) {
          newNotify.image = helper.glueAbsImgPath(params.reasonBrandImage);
        }
        if (params.brand && params.brand.image) {
          newNotify.brand.image = helper.glueAbsImgPath(params.brand.image);
        }

      } else if (params.type === 11) {

        // Author taged you in the review
        // Author taged you in the comment
        if (params.review) {
          newNotify.review = helper.mask(params.review, 'id,images');
          newNotify.review.brand = { id: params.review.brandId };
          newNotify.review.images = newNotify.review.images.map(function(image) {
            return helper.glueAbsImgPath(image);
          });
        }
        if (params.comment) {
          newNotify.comment = helper.mask(params.comment, 'id,authorId,parentId');
        }

        newNotify.follower = helper.mask(params.follower, 'id,photo,username,firstName,lastName');
        newNotify.follower.photo = helper.glueAbsImgPath(newNotify.follower.photo);

        params.usersId.forEach(function(userId) {
          newNotify.userId = userId;
          notificationsList.push(newNotify);
        });

      } else {
        resolve(err, null);
      }

      SystemNotification.create(notificationsList.length ? notificationsList : newNotify, function(err, sysNots) {
        if (err || !sysNots) {
          params.cb && params.cb(err ? err.message : 'Creation of System Notification failed', null);
          return;
        }

        if (Object.prototype.toString.call(sysNots) !== '[object Array]') {
          sysNots = [sysNots];
        }

        //
        sysNots.forEach(function (sysNot) {
          User.findById(sysNot.userId, function (err, user) {
            if (user && user.meta && user.meta.pushDeviceId && user.meta.deviceType) {
              var type,
                  text = 'Get system message',
                  userData = {
                    id: sysNot.id,
                    type: sysNot.type
                  },
                  authorName;

              if (sysNot.follower) {
                if (sysNot.follower.firstName && sysNot.follower.lastName) {
                  authorName = sysNot.follower.firstName + ' ' + sysNot.follower.lastName;
                } else if (sysNot.follower.firstName) {
                  authorName = sysNot.follower.firstName;
                } else {
                  authorName = sysNot.follower.username;
                }
              }

              if (sysNot.type === 1) {
                type = 'followers';
                text = authorName + ' is now following you';
                sysNot.follower && (userData.follower = sysNot.follower);
              }
              if (sysNot.type === 2) {
                type = 'likes';
                text = authorName + ' liked your review';
                sysNot.reviewId && (userData.reviewId = sysNot.reviewId);
                sysNot.follower && (userData.follower = sysNot.follower);
              }
              if (sysNot.type === 3) {
                type = 'comments';
                text = authorName + ' commented on your review';
                sysNot.reviewId && (userData.reviewId = sysNot.reviewId);
                sysNot.follower && (userData.follower = sysNot.follower);
              }
              if (sysNot.type === 4) {
                type = 'likes';
                text = authorName + ' liked your comment';
                sysNot.parentId && (userData.parentId = sysNot.parentId);
                sysNot.commentId && (userData.commentId = sysNot.commentId);
                sysNot.follower && (userData.follower = sysNot.follower);
              }
              if (sysNot.type === 5) {
                type = 'replies';
                text = authorName + ' replied to your comment';
                sysNot.parentId && (userData.parentId = sysNot.parentId);
                sysNot.commentId && (userData.commentId = sysNot.commentId);
                sysNot.follower && (userData.follower = sysNot.follower);
              }
              if (sysNot.type === 6) {
                type = 'achievements';
                text = sysNot.achievement.title + ' earned';
              }
              if (sysNot.type === 7) {
                type = 'system';
                sysNot.from && (userData.from = sysNot.from);
                sysNot.brandId && (userData.brandId = sysNot.brandId);
              }
              if (sysNot.type === 8) {
                type = 'system';
                sysNot.from && (userData.from = sysNot.from);
                sysNot.brandId && (userData.brandId = sysNot.brandId);
              }
              if (sysNot.type === 9) {
                type = 'system';
                sysNot.brand && (userData.brand = sysNot.brand);
                sysNot.reasonBrandId && (userData.reasonBrandId = sysNot.reasonBrandId);
              }
              if (sysNot.type === 10) {
                type = 'system';
                sysNot.brand && (userData.brand = sysNot.brand);
                sysNot.reasonBrandId && (userData.reasonBrandId = sysNot.reasonBrandId);
              }
              if (sysNot.type === 11) {
                type = 'replies';
                text = authorName + ' taged you in the ';
                if (sysNot.review) {
                  text += 'review';
                }
                if (sysNot.comment) {
                  text += 'comment';
                }
                sysNot.review && (userData.review = sysNot.review);
                sysNot.comment && (userData.comment = sysNot.comment);
                sysNot.follower && (userData.follower = sysNot.follower);
              }

              if (!type || type && user.settings.notifications[type].push) {
                //
                Installation.create({
                  appId: pushConfig.appName,
                  userId: user.id,
                  deviceToken: user.meta.pushDeviceId,
                  deviceType: user.meta.deviceType,
                  created: new Date(),
                  modified: new Date(),
                  status: 'Active'
                }, function(err, installation) {
                  if (!err) {
                    var mask = 'type,reviewId,commentId,reviewParentId,commentParentId,achievement,from,text,image',
                        message = helper.mask(sysNot, mask);

                    !message.text && (message.text = text);

                    // Send notify
                    notify({
                      installationId: installation.id,
                      deviceType: installation.deviceType,
                      userId: sysNot.userId,
                      message: JSON.stringify(message),
                      userData: userData
                    });
                    //

                  } else {
                    params.res.status(500);
                    params.res.json({
                      code: '000-500',
                      message: err ? err.message : 'Creation of Notification failed',
                      errors: []
                    });
                  }
                });
                //
              }
            }
          });
        });
        //

        resolve(err, sysNots);
      });
    });

    promiseCreateNotify.then(function(err, sysNot) {
      params.cb && params.cb(err, sysNot);
    });
  };

  //
  var rejectNotify = function (err) {
    params.cb && params.cb(err, null);
  };


  /*
  // INIT
  */
  checkNotifyDuration();
};
