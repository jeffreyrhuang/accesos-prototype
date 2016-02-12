var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/users');

module.exports = function (passport) {

	passport.serializeUser(function (user, done) {
		console.log('serializing');
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			console.log('deserializing');
			done(err, user);
		});
	});

	// SIGNUP
	passport.use('local-signup', new LocalStrategy({
			passReqToCallback: true
		},
		function (req, username, password, done) {
			//asynchronous - User.findOne wont fire unless data is sent back
			process.nextTick(function () {
				//checking to see if the user trying to signup alreadu exists
				User.findOne({
					'username': username
				}, function (err, user) {
					if (err)
						return done(err);
					if (user) {
						return done(null, false, req.flash('signupMessage', 'That username is already taken'));
					} else {
						//if there is no user with that name, create the user
						var newUser = new User();

						//set new user name/password
						newUser.username = username;
						newUser.password = newUser.generateHash(password);

						newUser.save(function (err) {
							if (err)
								throw err;
							return done(null, newUser);
						});
					}
				});
			});

		}));



	// LOGIN
	passport.use('local-login', new LocalStrategy({
			passReqToCallback: true
		},
		function (req, username, password, done) {
			//checking to see if the user trying to login already exists
			User.findOne({
				'username': username
			}, function (err, user) {
				if (err)
					return done(err);
				if (!user)
					return done(null, false, req.flash('loginMessage', 'User not found'));
				// if (user.password != password)
				if (!user.validPassword(password))
					return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.  Try again.'));
				return done(null, user);
			});
		}));

};