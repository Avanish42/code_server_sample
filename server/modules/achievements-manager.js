var app = require('../server'),
    Promise = require('promise'),
    usersAchievements = {},
    timer;

module.exports = function(params) {

  var User = app.models.UserModel,
      Category = app.models.Category,
      Brand = app.models.Brand,
      Review = app.models.Review,
      Comment = app.models.Comment,
      Achievement = app.models.Achievement;

  var conditions = app.get('achievementsConditions'),
      achievementsIds = [],
      matches = false;


  if (params.type === 'add_review') {
    /*
    // Explorer Brand`s: Nurse, Trainee, Doctor, Professor
    */
    achievementsIds = ['ach02', 'ach03', 'ach04'];

    achievementsIds.forEach(function(achievementId, index) {
      if (params.user.achievements.indexOf(achievementId) !== -1) {
        if (achievementsIds.length -1 === index) {
          return params.resolve();
        }
        return;
      }

      Review.count({authorId: params.user.id}, function(err, count) {
        if (err) {
          return params.resolve();
        }

        if (count < conditions[achievementId]) {
          params.resolve();
        } else {
          setAchievement(achievementId);
        }
      });
    });
  } else if (params.type === 'add_brand') {
    //FIXME
    return params.resolve();

    /*
    // Beginner, Competent, Proficient, Expert, Enthusiast, Eager beaver
    */
    achievementsIds = ['ach01', 'ach11', 'ach12', 'ach13', 'ach14', 'ach15', 'ach16'];

    achievementsIds.forEach(function(achievementId) {
      if (params.user.achievements.indexOf(achievementId) !== -1) {
        return;
      }

      matches = true;
      if (achievementId === 'ach01') {
        // Beginner
        setAchievement(achievementId);
      } else if (achievementId === 'ach11' || achievementId === 'ach12' || achievementId === 'ach13') {
        // Competent, Proficient, Expert
      } else if (achievementId === 'ach14') {
        // Enthusiast
        Review.find({authorId: params.user.id}, function (err, reviews) {
          reviews = reviews && reviews.length ? reviews : [];

          if (reviews.length < conditions[achievementId]) {
            params.resolve();
            return;
          }

          var durationDays = [];

          for (var i = 0; i < reviews.length; i++) {
            var dayNum = Math.round(reviews[i].createdAt / (24 * 60 * 60 * 1000));
            if (i === 0) {
              durationDays.push(dayNum);
            } else if (reviews[i].createdAt < (reviews[i - 1].createdAt - (24 * 60 * 60 * 1000))) {
              if (durationDays.indexOf(dayNum) === -1) {
                durationDays.push(dayNum);
              }
            }
          }

          if (durationDays.length >= conditions[achievementId]) {
            setAchievement(achievementId);
          } else {
            params.resolve();
          }
        });
      } else if (achievementId === 'ach15') {
        // Eager beaver
        Review.find({authorId: params.user.id}, function (err, reviews) {
          reviews = reviews && reviews.length ? reviews : [];

          if (reviews.length < conditions[achievementId]) {
            params.resolve();
            return;
          }

          var durationDays = {},
              condition = false;

          reviews.forEach(function(review) {
            var dayNum = Math.round(review.createdAt / (24 * 60 * 60 * 1000));

            !durationDays[dayNum] && (durationDays[dayNum] = 0);
            durationDays[dayNum]++;

            if (durationDays[dayNum] >= conditions[achievementId]) {
              condition = true;
            }
          });

          if (condition) {
            setAchievement(achievementId);
          } else {
            params.resolve();
          }
        });
      } else if (achievementId === 'ach16') {
        // Flexile
        Review.find({authorId: params.user.id}, function (err, reviews) {
          reviews = reviews && reviews.length ? reviews : [];

          Category.find({}, function(err, categories) {
            if (err || !categories) {
              params.resolve();
              return;
            }

            var categoriesNum = categories.length,
                durationDays = [];

            reviews.forEach(function(review) {
              if (durationDays.indexOf(review.categoryId) === -1) {
                durationDays.push(review.categoryId);
              }
            });

            if (categoriesNum === durationDays.length) {
              setAchievement(achievementId);
            } else {
              params.resolve();
            }
          });
        });
      } else {
        params.resolve();
      }
    });

    if (!matches) { params.resolve(); }
    //
  } else if (params.type === 'add_comment') {
    //FIXME
    return params.resolve();

    /*
    // Commentator Bronze, Silver, Gold || Talkative Bronze, Silver, Gold
    */
    achievementsIds = ['ach02', 'ach03', 'ach04', 'ach31', 'ach32', 'ach33'];
    var promises = [];

    achievementsIds.forEach(function(achievementId) {
      if (params.user.achievements.indexOf(achievementId) !== -1) {
        return;
      }

      if ((achievementId === 'ach02' || achievementId === 'ach03' || achievementId === 'ach04') && params.user.comments.length >= conditions[achievementId]) {
        setAchievement(achievementId);
      } else if (achievementId === 'ach31' || achievementId === 'ach32' || achievementId === 'ach33') {
        promises.push(commentsPostCheck(achievementId, Promise.resolve, Promise.reject));
      }
    });

    // support fncs
    function commentsPostCheck(achievementId, resolve) {
      Comment.find({where: {id: {inq: params.user.comments}}}, function(err, comments) {
        var commentsInDay = 0,
            firstDayNum;

        for (var i = 0; i < comments.length; i++) {
          var dayNum = Math.round(comments[i].createdAt / (24 * 60 * 60 * 1000));
          if (i === 0) {
            firstDayNum = Math.round(comments[i].createdAt / (24 * 60 * 60 * 1000));
            commentsInDay++;
          } else if (firstDayNum === dayNum) {
            commentsInDay++;
          }
        }

        if (commentsInDay >= conditions[achievementId]) {
          resolve(achievementId);
        } else {
          resolve(null);
        }
      });
    }
    //

    Promise.all(promises)
      .then(function(response) {
        matches = false;
        response.forEach(function(achievementId) {
          if (achievementId) {
            matches = true;
            setAchievement(achievementId);
          }
        });

        if (!matches) {
          params.resolve();
        }
      });
    //
  } else if (params.type === 'added_like_on_review') {
    //FIXME
    return params.resolve();

    /*
    // Great review Bronze, Silver, Gold
    */
    achievementsIds = ['ach05', 'ach06', 'ach07'];

    achievementsIds.forEach(function(achievementId) {
      if (params.user.achievements.indexOf(achievementId) !== -1) {
        return;
      }

      matches = true;
      if ((achievementId === 'ach05' || achievementId === 'ach06' || achievementId === 'ach07') && params.review.likes.length >= conditions[achievementId]) {
        setAchievement(achievementId);
      } else {
        params.resolve();
      }
    });

    if (!matches) { params.resolve(); }
    //
  } else if (params.type === 'add_like') {
    //FIXME
    return params.resolve();

    /*
    // Generous Bronze, Silver, Gold
    */
    achievementsIds = ['ach22',  'ach23',  'ach24'];

    achievementsIds.forEach(function(achievementId) {
      if (params.user.achievements.indexOf(achievementId) !== -1) {
        return;
      }

      matches = true;
      if ((achievementId === 'ach22' || achievementId === 'ach23' || achievementId === 'ach24') && params.user.likes.length >= conditions[achievementId]) {
        setAchievement(achievementId);
      } else {
        params.resolve();
      }
    });

    if (!matches) { params.resolve(); }
    //
  } else if (params.type === 'added_comment_on_review') {
    //FIXME
    return params.resolve();

    /*
    // Buzz maker Bronze, Silver, Gold
    */
    achievementsIds = ['ach25', 'ach26', 'ach27'];

    achievementsIds.forEach(function(achievementId) {
      if (params.user.achievements.indexOf(achievementId) !== -1) {
        return;
      }

      matches = true;
      if ((achievementId === 'ach25' || achievementId === 'ach26' || achievementId === 'ach27') && params.review.comments.length >= conditions[achievementId]) {
        setAchievement(achievementId);
      } else {
        params.resolve();
      }
    });

    if (!matches) { params.resolve(); }
    //
  } else if (params.type === 'user_login') {
    //FIXME
    return params.resolve();

    /*
    // Revival, Brand Beat friend
    */
    achievementsIds = ['ach17', 'ach18'];
    var now = new Date().getTime();

    achievementsIds.forEach(function(achievementId) {
      if (params.user.achievements.indexOf(achievementId) !== -1) {
        return;
      }

      matches = true;
      if (achievementId === 'ach17') {
        // Revival
        if (params.user.modifiedAt < now - (conditions[achievementId] * 24 * 60 * 60 * 1000)) {
          setAchievement(achievementId);
        } else {
          params.resolve();
        }
      } else if (achievementId === 'ach18') {
        // Brand Beat friend
        if (params.user.createdAt < now - (conditions[achievementId].days * 24 * 60 * 60 * 1000) && params.user.reviews.length >= conditions[achievementId].minReviews) {
          setAchievement(achievementId);
        } else {
          params.resolve();
        }
      } else {
        params.resolve();
      }
    });

    if (!matches) { params.resolve(); }
    //
  } else if (params.type === 'user_added_follower') {
    //FIXME
    return params.resolve();

    /*
    // Popular Bronze, Silver, Gold
    */
    achievementsIds = ['ach19', 'ach20', 'ach21'];

    achievementsIds.forEach(function(achievementId) {
      if (params.user.achievements.indexOf(achievementId) !== -1) {
        return;
      }

      matches = true;
      if ((achievementId === 'ach19' || achievementId === 'ach20' || achievementId === 'ach21') && params.user.followers.length >= conditions[achievementId]) {
        setAchievement(achievementId);
      } else {
        params.resolve();
      }
    });

    if (!matches) { params.resolve(); }
    //
  } else if (params.type === 'add_following') {
    //FIXME
    return params.resolve();

    /*
    // Curious Bronze, Silver, Gold
    */
    achievementsIds = ['ach28', 'ach29', 'ach30'];

    achievementsIds.forEach(function(achievementId) {
      if (params.user.achievements.indexOf(achievementId) !== -1) {
        return;
      }

      matches = true;
      if ((achievementId === 'ach28' || achievementId === 'ach29' || achievementId === 'ach30') && params.user.following.length >= conditions[achievementId]) {
        setAchievement(achievementId);
      } else {
        params.resolve();
      }
    });

    if (!matches) { params.resolve(); }
    //
  } else {
    params.resolve();
  }


  /*
  // Support fncs
  */
  function setAchievement(achievementId, achievements) {
    var uAchievs = usersAchievements[params.user.id] ? JSON.parse(JSON.stringify(usersAchievements[params.user.id])) : null;

    if (!uAchievs) {
      if (!achievements) {
        params.user.achievements.push(achievementId);
      } else {
        params.user.achievements = achievements;
      }
      usersAchievements[params.user.id] = params.user.achievements;
    } else {
      if (uAchievs.indexOf(achievementId) === -1) {
        uAchievs.push(achievementId);
      }
      clearTimeout(timer);
      timer = setTimeout(function() {
        setAchievement(achievementId, uAchievs);
      }, 2000);
      return;
    }

    params.user.updateAttribute('achievements', params.user.achievements, function(err, user) {
      if (!err && user) {
        Achievement.findById(achievementId, function(err, achievement) {
          if (!err && achievement) {
            // SYSTEM NOTIFICATION
            User.emit('systemSend', {
              state: 'achievementsAdd',
              userId: user.id,
              achievement: achievement
            });

            // EMAIL NOTIFICATION
            User.emit('emailSend', {
              state: 'newAchievement',
              user: user,
              email: user.email,
              achievement: achievement
            });
          }
        });
      }

      delete usersAchievements[params.user.id];
      achievements && (timer = null);
      params.resolve(err, user);
    });
  }

};
