'use strict';

var _ = require('underscore');
var bcrypt = require('bcrypt');
var passport = require('passport');
var uuid = require('node-uuid');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var models = require('../models');
var config = require('../config');

var makeRedirect = function(dest) {
  return function(req, res) {
    res.redirect(dest);
  };
};

var scopedPath = function(relativePath) {
  return '/subdomain/:domain{PATH}'.replace('{PATH}', relativePath);
};

var resolveProfile = function(profile, provider, done) {
  var obj = {
    id: uuid.v4(),
    anonymous: false,
    emails: _.each(profile.emails, function(e, i, l) {l[i] = e.value;}),
    firstName: profile.name.givenName,
    lastName: profile.name.familyName,
    homePage: profile.profileUrl,
    providers: {provider: profile.id}
  };

  models.User.findOne({
    where: {
      emails: {
        $overlap: obj.emails
      }
    }
  }).then(function(result) {
    if (result) {
      // We have a match. Ensure that the user has this provider saved.
      result.providers = _.extend(result.providers, obj.providers);
      result.save().then(function(result) {
        done(null, result);
      });
    } else {
      // We had no match. Create a new user.
      models.User.create(obj).then(function(result) {
        done(null, result);
      });
    }
  });
};

var setupAuth = function() {
  passport.use(new GoogleStrategy({
    clientID: config.get('google:app_id'),
    clientSecret: config.get('google:app_secret'),
    callbackURL:  config.get('urlTmpl')
      .replace('SCHEME', config.get('connection_scheme'))
      .replace('SUB', config.get('auth_subdomain'))
      .replace('DOMAIN', config.get('base_domain'))
      .replace('PATH', 'google/callback'),
    profileFields: ['id', 'displayName', 'name', 'username', 'emails', 'photos']
  }, function(accessToken, refreshToken, profile, done) {
    resolveProfile(profile, 'google', done);
  }));

  passport.use(new FacebookStrategy({
    clientID: config.get('facebook:app_id'),
    clientSecret: config.get('facebook:app_secret'),
    callbackURL:  config.get('urlTmpl')
      .replace('SCHEME', config.get('connection_scheme'))
      .replace('SUB', config.get('auth_subdomain'))
      .replace('DOMAIN', config.get('base_domain'))
      .replace('PATH', 'facebook/callback'),
    profileFields: ['id', 'name', 'email', 'photos']
  }, function(accessToken, refreshToken, profile, done) {
    resolveProfile(profile, 'facebook', done);
  }));

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(profile, done) {
    var err = null;
    done(err, profile);
  });
};

var setLocals = function(req, res, next) {
  var config = req.app.get('config');

  if ((config.get('test:testing') === true) &&
    !req.user && config.get('test:user')
  ) {
    req.user = config.get('test:user');
  }

  var locales = config.get('locales');
  if (req.session.lang && (locales.indexOf(req.session.lang) >= 0)) {
    req.setLocale(req.session.lang);
  } else {
    req.setLocale(_.first(locales));
  }

  res.locals.currentUser = req.user ? req.user : null;

  res.locals.baseDomain =  config.get('base_domain');
  res.locals.authDomain = config.get('auth_subdomain');
  res.locals.systemDomain = config.get('system_subdomain');
  res.locals.loginUrl = config.get('urlTmpl')
    .replace('SCHEME', req.protocol)
    .replace('SUB', config.get('auth_subdomain'))
    .replace('DOMAIN', config.get('base_domain'))
    .replace('PATH', 'login');
  res.locals.logoutUrl = config.get('urlTmpl')
    .replace('SCHEME', req.protocol)
    .replace('SUB', config.get('auth_subdomain'))
    .replace('DOMAIN', config.get('base_domain'))
    .replace('PATH', 'logout');
  res.locals.profileUrl = config.get('urlTmpl')
    .replace('SCHEME', req.protocol)
    .replace('SUB', config.get('auth_subdomain'))
    .replace('DOMAIN', config.get('base_domain'))
    .replace('PATH', 'profile');
  res.locals.systemUrl = config.get('urlTmpl')
    .replace('SCHEME', req.protocol)
    .replace('SUB', config.get('system_subdomain'))
    .replace('DOMAIN', config.get('base_domain'))
    .replace('PATH', '');
  res.locals.sysAdmin = req.app.get('sysAdmin');
  res.locals.locales = config.get('locales');
  res.locals.currentLocale = req.locale;
  res.locals.currentYear = req.app.get('year');

  var settingName = 'current_url';
  res.locals[settingName] = 'SCHEME://DOMAIN_PATH'
    .replace('SCHEME', req.protocol)
    .replace('DOMAIN_', req.get('host'))
    .replace('PATH', req.path);

  var settingName = 'current_domain';
  res.locals[settingName] = 'SCHEME://DOMAIN_'
    .replace('SCHEME', req.protocol)
    .replace('DOMAIN_', req.get('host'));

  var settingName = 'url_query';
  res.locals[settingName] = req.query;

  var settingName = 'error_messages';
  res.locals[settingName] = req.flash('error');

  var settingName = 'info_messages';
  res.locals[settingName] = req.flash('info');
  res.locals.discussionForum = config.get('discussion_forum');

  res.locals.urlFor = function(name) {
    if (name === 'overview') {
      return '/';
    }
    return null;
  };

  next();
};

module.exports = {
  makeRedirect: makeRedirect,
  setupAuth: setupAuth,
  scoped: scopedPath,
  setLocals: setLocals
};
