var express = require('express');
var router = express.Router();
var passport = require('passport');

//route middleware to make sure user is Authenticated
var verified = function(req, res, next) {
	if(req.isAuthenticated())
		return next();
	res.redirect('/');
};

module.exports = function(passport) {

	router.get('/home', verified, function(req, res, next) {
	  res.render('home');
	});

	router.get('/', function(req, res, next) {
	  res.render('index', {alertMessage: req.flash('loginMessage')});
	});

	router.post('/login', passport.authenticate('local', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash: true
	}));

	router.get('/motor', function(req, res, next) {
	  res.render('motor');
	});

	router.get('/acceso', function(req, res, next) {
	  res.render('acceso');
	});

	router.get('/peso', function(req, res, next) {
	  res.render('peso');
	});

	router.get('/encuestas', function(req, res, next) {
	  res.render('encuestas');
	});

	router.get('/cliente', function(req, res, next) {
	  res.render('cliente');
	});

	return router;

};

