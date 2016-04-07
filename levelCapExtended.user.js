// ==UserScript==
// @name    Kongregate Level Extension
// @description Push the Kongregate level cap to 100!
// @namespace resterman
// @version   1.4.3
// @author    resterman
// @run-at    document-start
// @match   http://www.kongregate.com/*
// @grant   none
// ==/UserScript==

var UserStorage = {
  levelPoints: [],
  REAL_MAX_LVL: 65,
  FAKE_MAX_LVL: 100,
  USER_INFO: 'http://www.kongregate.com/api/user_info.json?username='
};

UserStorage.levelPoints[65] = 36560;
UserStorage.levelPoints[66] = 38340;
UserStorage.levelPoints[67] = 40195;
UserStorage.levelPoints[68] = 42125;
UserStorage.levelPoints[69] = 44130;
UserStorage.levelPoints[70] = 46210;
UserStorage.levelPoints[71] = 48375;
UserStorage.levelPoints[72] = 50625;
UserStorage.levelPoints[73] = 52960;
UserStorage.levelPoints[74] = 55380;
UserStorage.levelPoints[75] = 57885;
UserStorage.levelPoints[76] = 60485;
UserStorage.levelPoints[77] = 63180;
UserStorage.levelPoints[78] = 65970;
UserStorage.levelPoints[79] = 68855;
UserStorage.levelPoints[80] = 71835;
UserStorage.levelPoints[81] = 74920;
UserStorage.levelPoints[82] = 78110;
UserStorage.levelPoints[83] = 81405;
UserStorage.levelPoints[84] = 84805;
UserStorage.levelPoints[85] = 88310;
UserStorage.levelPoints[86] = 91930;
UserStorage.levelPoints[87] = 95665;
UserStorage.levelPoints[88] = 99515;
UserStorage.levelPoints[89] = 103480;
UserStorage.levelPoints[90] = 107560;
UserStorage.levelPoints[91] = 111765;
UserStorage.levelPoints[92] = 116095;
UserStorage.levelPoints[92] = 116095;
UserStorage.levelPoints[93] = 120550;
UserStorage.levelPoints[94] = 125130;
UserStorage.levelPoints[95] = 129835;
UserStorage.levelPoints[96] = 134675;
UserStorage.levelPoints[97] = 139650;
UserStorage.levelPoints[98] = 144760;
UserStorage.levelPoints[99] = 150005;
UserStorage.levelPoints[100] = 155385;

var Actions = {

  HEADER: function () {
    createCapChanger();

    var ks = new KongScript();
    ks.waitFor('active_user', null, 50).then(function (active_user) {
      var user = new LevelCapUser(active_user.username());
      user.points = active_user.points();
      user.getLevel().then(function (level) {
        if (level < UserStorage.REAL_MAX_LVL) return;

        // Update nav_welcome_box levelbug
        var levelbug = document.getElementById('mini-profile-level');
        updateLevelbug(levelbug, level);

        // Update my kong hover profile
        updateMyKongProfile(user);
      })
      .catch(function (err) {
        console.log(err);
      });
    });
  },

  CHAT: function () {
    var ks = new KongScript();
    ks.waitFor('ChatRoom').then(function (cr) {
      ks.waitFor('MiniProfile');
    })
    .then(function (mp) {
      ks.waitFor('holodeck');
    })
    .then(function (h) {
      injectChatRoomCode();
      injectMiniProfileCode();
    });
  },

  PROFILE: function () {
    var user = new ProfileUser();
    user.getPoints().then(function (points) {
        if (points < UserStorage.levelPoints[UserStorage.REAL_MAX_LVL])
        return Promise.reject('No need to update.');

      return user.getLevel();
    })
    .then(function (level) {
      // Update level number
        var htmlLevel = document.getElementById('user_level')
        .getElementsByTagName('a')[1]
        .getElementsByTagName('span')[0];
        htmlLevel.innerHTML = '' + level;

      // Update levelbug
      var levelbug = document.getElementById('profile_hgroup')
        .getElementsByClassName('levelbug')[0];
      updateLevelbug(levelbug, level);

      updateProfileProgressBar(user.points, user.level);
    })
    .catch(function (err) {
      console.log(err);
    });
  },

  HOVER_BOX: function () {
    var ks = new KongScript();

    ks.waitFor('UserProfileHoverbox').then(function (u) {
      injectUserProfileHoverbox();
    });
  },

  LEADERS: function () {
    var leadersTable = document.getElementsByClassName('leaders')[1];
    if (!leadersTable) return;

    var leadersRows = [].slice
      .call(leadersTable.getElementsByTagName('tbody')[0]
          .getElementsByTagName('tr'));
    if (!leadersRows) return;

    leadersRows.map(function (row) {
      var usernameLink = row.getElementsByTagName('td')[1].getElementsByClassName('levelbug')[0];
      var levelText = row.getElementsByTagName('td')[5];

      var user = new LevelCapUser(usernameLink.innerHTML);
      var p = Promise
        .resolve(user.getLevel())
        .then(function (level) {
          usernameLink.className = usernameLink.className
            .replace(/level_[0-9]*/i, 'level_' + level);
          levelText.innerHTML = level;

          return level;
        });

      return p;
    });
  }

};

var UpdateActions = [
  {
    pattern: new RegExp('https?://www.kongregate.com', 'i'),
    actions: [Actions.HEADER, Actions.HOVER_BOX]
  },
  {
    pattern: new RegExp('https?://www.kongregate.com/accounts/', 'i'),
    actions: [Actions.PROFILE]
  },
  {
    pattern: new RegExp('https?://www.kongregate.com/accounts/leaders[?]?', 'i'),
    actions: [Actions.LEADERS]
  },
  {
    pattern: new RegExp('https?://www.kongregate.com/games/', 'i'),
    actions: [Actions.CHAT]
  }
];

KongScript = function() {};
KongScript.prototype = {

  CHECK_TIMEOUT: 10, // seconds before reaching timeout
  CHECK_INTERVAL: 100, // milliseconds between class existance check

  /**
   *  Waits for a class to be defined.
   *
   *  @param  {String}  className The class name to wait for.
   *  @param  {Number}  [timeout=CHECK_TIMEOUT] Seconds before timeout
   *  @param  {Number}  [interval=CHECK_INTERVAL] Milliseconds between
   *    each check.
   *
   *  @return a promise that is fulfilled whenever the class is defined
   *    and is rejected when the timeout is reached.
   */
  waitFor: function (className, timeout, interval) {
    if (!className)
      return Promise.reject('Class name must be specified.');

    timeout = (timeout !== undefined ? timeout : this.CHECK_TIMEOUT);
    interval = (interval !== undefined ? interval : this.CHECK_INTERVAL);

    return new Promise(function (resolve, reject) {
      var checkTimes = timeout * 1000 / interval;
      var timeInterval = setInterval(function () {
        if (window[className]) {
          console.log(className + ' loaded.');

          resolve(window[className]);
          clearInterval(timeInterval);
        } else if (checkTimes-- <= 0) {
          console.log('Timeout.');

          reject(className + ' couldn\'t be loaded.');
          clearInterval(timeInterval);
        }
      }, interval);
    });
  }

};

ProfileUser = function () {
  this.points = null;
  this.level  = null;
};
ProfileUser.prototype = {

  /**
   *  Return points based on the points in the loaded profile page.
   */
  getPoints: function () {
    var promise, user = this;

    if (user.points === null) {
      promise = new Promise(function (resolve, reject) {
        var reps = 0;
        var interval = setInterval(function () {
          var user_points = document.getElementById('user_points');
          var navPoints = user_points ?
            user_points.getElementsByClassName('user_metric_stat')[0]
              .getElementsByTagName('span') [0] :
            null;

          if (navPoints) {
            var points = parseInt(navPoints.textContent);
            user.points = points;
            resolve(points);

            clearInterval(interval);
          }

          if (reps++ > 10000) {
            reject();

            clearInterval(interval);
          }
        }, 100);
      });
    } else {
      promise = Promise.resolve(user.points);
    }

    return promise;
  },

  getLevel: function () {
    var user = this;

    if (user.level === null) {
      var promise = user.getPoints()
        .then(function (points) {
          var level = UserStorage.REAL_MAX_LVL;
          while (level <= UserStorage.FAKE_MAX_LVL &&
              points >= UserStorage.levelPoints[level])
            level++;

          return (user.level = level - 1);
        });

      return promise;
    } else {
      return Promise.resolve(user.level);
    }
  }

};

LevelCapUser = function (username) {
  this.username   = username;
  this.points   = null;
  this.level    = null;
};
LevelCapUser.prototype = {

  /**
   *  Return the user points. If points weren't loaded, it will load them
   *  with an http request.
   *
   *  @return a promise resolved with user points.
   */
  getPoints: function () {
    var user = this;

    if (user.points === null) {
      var promise = HttpGetPromise(UserStorage.USER_INFO + user.username)
        .then(function (json) {
          return JSON.parse(json).user_vars.points;
        })
        .then(function (points) {
          return (user.points = points);
        });

      return promise;
    } else {
      return Promise.resolve(user.points);
    }
  },

  /**
   *  Return the user level. If points weren't loaded, it will load them
   *  with an http request.
   *
   *  @return a promise resolverd with user level.
   */
  getLevel: function () {
    var user = this;

    if (user.level === null) {
      var promise = user.getPoints()
        .then(function (points) {
          var level = UserStorage.REAL_MAX_LVL;
          while (level <= UserStorage.FAKE_MAX_LVL &&
              points >= UserStorage.levelPoints[level])
            level++;

          return (user.level = level - 1);
        });

      return promise;
    } else {
      return Promise.resolve(user.level);
    }
  }

};

ChatUserStorage = function () {
  this.users  = {};
};
ChatUserStorage.prototype = {

  /**
   *  Return the level of the user.
   *
   *  @return user level.
   */
  getLevel: function (username) {
    username = username.toLowerCase();

    if (this.users[username] === undefined)
      this.users[username] = new LevelCapUser(username);

    return this.users[username].getLevel();
  }

};

var HttpGetPromise = function (url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();

    xhr.addEventListener('load', function () {
      if (this.status == 200) {
        resolve(this.responseText);
      } else {
        reject(this.statusText);
      }
    });

    xhr.addEventListener('error', function () {
      reject(this.statusText);
    });
  });
};

// Update profile progress bar
function updateProfileProgressBar(points, level) {
  if (points >= UserStorage.levelPoints[UserStorage.FAKE_MAX_LVL])
    return;

  var currLevelPoints = UserStorage.levelPoints[level],
    nextLevelPoints = UserStorage.levelPoints[level + 1],
    pointsLeft = nextLevelPoints - points,
    pointsBetween = nextLevelPoints - currLevelPoints,
    percentageRemaining = 100 * (1 - (pointsLeft / pointsBetween));

  var pointsInfo = document.createElement('span');
  pointsInfo.className = 'points_bar_container';

  var pointsInfoP = document.createElement('p');
  pointsInfo.appendChild(pointsInfoP);

  var pointsBarContainer = document.createElement('points_bar_container');
  pointsBarContainer.className = 'points_info mlm';
  pointsBarContainer.innerHTML = 'Points needed for next level: <strong class="points_to_level_up">' + pointsLeft + '</strong></span>';
  pointsInfoP.appendChild(pointsBarContainer);

  var pointsBar = document.createElement('span');
  pointsBar.className = 'points_bar mhm';
  pointsInfoP.appendChild(pointsBar);

  var pointsProgress = document.createElement('span');
  pointsProgress.className = 'points_progress';
  pointsProgress.setAttribute('style', 'width:' + percentageRemaining + '%;');
  pointsBar.appendChild(pointsProgress);

  var pointsLevel = createLevelbug(level + 1);
  pointsInfoP.appendChild(pointsLevel);

  document.getElementById('profile_heading').appendChild(pointsInfo);
}

// Update my kong hover profile
function updateMyKongProfile(user) {
  var points = user.points, level = user.level;

  // Update levelbug
  var userP = document.getElementById('main_nav_mykong')
    .getElementsByClassName('user')[0];
  updateLevelbug(userP.getElementsByClassName('levelbug')[0], level);

  if (level == UserStorage.FAKE_MAX_LVL) return;

  // Remove cake and draw points left message, level progress bar and
  // next level levelbug
  var pointsNeeded = UserStorage.levelPoints[level + 1] - points;
  var pointsPercent =
    100 * (points - UserStorage.levelPoints[level]) /
    (UserStorage.levelPoints[level + 1] - UserStorage.levelPoints[level]);

  var pointsP = document.createElement('p');
  pointsP.className = 'points';
  pointsP.innerHTML = '<strong>'+ pointsNeeded +' points</strong> needed for the next level';

  var barP = document.createElement('p');
  barP.className = 'progress';

  var barSpan = document.createElement('span');
  barSpan.className = 'progress_bar';
  barP.appendChild(barSpan);

  var barPercentSpan = document.createElement('span');
  barPercentSpan.className = 'progress_percent';
  barPercentSpan.setAttribute('style', 'width:'+ pointsPercent + '%;');
  barSpan.appendChild(barPercentSpan);

  var levelStrong = document.createElement('strong');
  levelStrong.className = 'level';
  levelStrong.innerHTML = 'Level';
  barP.appendChild(levelStrong);

  var levelbug = createLevelbug(level + 1);
  levelStrong.appendChild(levelbug);

  var cake = document.getElementsByClassName('points w_cake')[0];

  var parent = cake.parentNode;
  parent.removeChild(cake);
  parent.appendChild(pointsP);
  parent.appendChild(barP);
}

function injectChatRoomCode () {
  ChatRoom.prototype._updateUser = ChatRoom.prototype.updateUser;
  ChatRoom.prototype.updateUser = function (a, b) {
    holodeck.uStorage = holodeck.uStorage || new ChatUserStorage();

        var u = a.variables, chatRoom = this;
    if (u.level == UserStorage.REAL_MAX_LVL) {
      holodeck.uStorage.getLevel(u.username)
        .then(function (level) {
          u.level = level;
          chatRoom._updateUser(a, b);
        });
    } else {
      this._updateUser(a, b);
    }
  };
}

function injectMiniProfileCode () {
  MiniProfile.prototype.activate = function(a, b) {
        this._chat_window.setActiveTempPane(this);
        this._current_username = a;
        this._current_room = b;
        var c = this._container,
            d = this._chat_window,
            e = this;
        $("user_mini_profile").update("");
        c.down(".room_name").update(b.name());
        d.hideChatWindow();
        d._chat_tab_clicked = !1;
        c.ieHappyShow();
        d.showSpinner();
        new Ajax.Updater({
            success: "user_mini_profile"
        }, "/accounts/" + a + ".chat", {
            method: "get",
            onComplete: function() {
        // Change only if the user is level 65
        holodeck.uStorage.getLevel(a).then(function (level) {
          var miniProfile = document.getElementById('user_mini_profile');
          var levelRegExp = /level_([0-9]*)/i;

          if (level >= UserStorage.REAL_MAX_LVL)
            miniProfile.innerHTML = miniProfile.innerHTML.replace(levelRegExp, 'level_' + level);

          !1 === d._chat_tab_clicked && (d.hideSpinner(), e.setupBanAndSilencingControls(a), active_user.addCapturedSelector("#add_friend"), active_user.addCapturedSelector("#mute_user"));
        });
      }
        });
    };
}

function injectUserProfileHoverbox() {
  UserProfileHoverbox.prototype._openHoverbox = UserProfileHoverbox.prototype.openHoverbox;
  var p = UserProfileHoverbox.prototype.openHoverbox.__proto__;

  UserProfileHoverbox.prototype.openHoverbox = function () {
    var hoverbox = this;
    var user = this._currentUserAnchor.href.match(/accounts\/(.*)/i)[1];

    if (this._hoverboxCache[this._currentUserAnchor.href]) {
      hoverbox._openHoverbox();
    } else {
      var u = new LevelCapUser(user);
      u.getLevel().then(function (level) {
        hoverbox._openHoverbox();

        if (level < UserStorage.REAL_MAX_LVL) return;

        hoverbox._hoverbox.observe('afterOpen', function(){
          var l = hoverbox._hoverbox.container
            .getElementsByClassName('mini_profile_level')[0];
          l.getElementsByTagName('span')[0].textContent = '' + level;
        });
      })
      .catch(function (err) {
        // Open it anyways, but the level may be capped at 65
        hoverbox._openHoverbox();
        console.log(err);
      });
    }
  };
  // Restoring __proto__ because firefox rips if not
  UserProfileHoverbox.prototype.openHoverbox.__proto__ = p;
}

function createLevelbug(level) {
  var levelbug = document.createElement('span');
  levelbug.className = 'spritesite levelbug level_' + level;
  levelbug.alt = 'Levelbug ' + level;
  levelbug.title = 'Level ' + level;

  return levelbug;
}

function updateLevelbug(levelbug, level) {
  levelbug.className = levelbug.className.replace(/level_[0-9]*/, 'level_' + level);
  levelbug.title = 'Level ' + level;
}

function getFakeMaxLevel() {
  var l = localStorage.getItem('fake_max_level');

  if (l !== null)
    UserStorage.FAKE_MAX_LVL = l;
}

function setFakeMaxLevel() {
  var level = window.prompt('Set the new level cap.', UserStorage.FAKE_MAX_LVL);
  level = parseInt(level);

  if (level > 65 && level <= 100) {
    UserStorage.FAKE_MAX_LVL = level;
    localStorage.setItem('fake_max_level', level);
  } else if (!isNaN(level)) alert('New level cap must be between 66 and 100');
}

// Creates the button to change the level cap
function createCapChanger() {
  var levelCapChanger = document.createElement('li');

  var levelCapStyle = document.createElement('style');
  levelCapStyle.innerHTML = "#level_cap_control::after {border-bottom:1px dotted #9b9a9a;bottom:0;content:'';display:block;left:11px;position:absolute;right:11px;}";
  levelCapChanger.appendChild(levelCapStyle);

  var linkCapChanger = document.createElement('a');
  linkCapChanger.id = 'level_cap_control';
  linkCapChanger.innerHTML = 'Level cap';
  linkCapChanger.href = '#';
  linkCapChanger.addEventListener('click', function () {
    setFakeMaxLevel();
  });
  levelCapChanger.appendChild(linkCapChanger);

  var signOut = document.getElementById('welcome_box_sign_out');
  var cogList = signOut.parentNode.parentNode;
  cogList.insertBefore(levelCapChanger, signOut.parentNode);
}

// Creates new levelbug css classes till level 100
function createLevelbugCSS() {
  var levelStyle = document.createElement('style');

  for (var i = UserStorage.REAL_MAX_LVL; i <= UserStorage.FAKE_MAX_LVL; i++)
    levelStyle.innerHTML += '.level_' + i + '{background-position: 100% ' + ( - 1555 - 20 * (i - UserStorage.REAL_MAX_LVL)) + 'px;}';

  document.head.appendChild(levelStyle);
}

function init() {
  createLevelbugCSS();
  getFakeMaxLevel();

  UpdateActions.forEach(function (uAction, i, arr) {
    if (uAction.pattern.test(document.URL))
        uAction.actions.forEach(function (f, i, arr) { f(); });
  });
}

window.addEventListener('load', init);

