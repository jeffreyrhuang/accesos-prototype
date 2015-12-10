var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/users');

module.exports = function(passport) {

	passport.serializeUser(function(user, done){
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done){
		User.findById(id, function(err, user){
			done(err, user);
		});
	});

	passport.use('local', new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, username, password, done) {
		//find a user whose email is the same as the forms email
		//we are checking to see if the user trying to login already exists
		User.findOne({'local.username': username}, function(err, user){
			if(err)
				return done(err);

			if(!user)
				return done(null, false, req.flash('loginMessage', 'No user found'));
			if (!user.validPassword(password))
				return done(null, false, req.flash('loginMessage', 'Ops! Wrong password'));
			return done(null, user);
		});
	}));

};