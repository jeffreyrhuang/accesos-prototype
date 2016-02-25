var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

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
				//checking to see if the user trying to signup already exists
				User.findOne({
					'username': username.toLowerCase()
				}, function (err, user) {
					if (err) {return done(err)};
					if (user) {
						return done (null, false, req.flash('signupMessage', 'Ese nombre de usuario no esta disponible'));
					} else if (password!= req.body.passwordDos){
						return done (null, false, req.flash('signupMessage', 'Las contraseñas no son iguales'));
					} else if (req.body.employeeKey != process.env.EMP_KEY){
						return done (null, false, req.flash('signupMessage', 'Clave incorrecta'));
					} else {
						//if there is no user with that name, create the user
						var newUser = new User();

						//set new username, email and password
						newUser.username = username.toLowerCase();
						newUser.email = req.body.email;
						newUser.password = newUser.generateHash(password);

						//save to database
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
				'username': username.toLowerCase()
			}, function (err, user) {
				if (err){return done(err);}
				if (!user)
					return done (null, false, req.flash('loginMessage', 'No existe usuario'));
				if (!user.validPassword(password))
					return done (null, false, req.flash('loginMessage', 'Ops! Contraseña equivocada.  Intente de nuevo'));
				return done(null, user);
			});
		}));

};