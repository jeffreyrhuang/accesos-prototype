var express = require('express');
var router = express.Router();
//var app = express();
var passport = require('passport');

module.exports = function(passport) {

	router.get('/', function(req, res, next) {
	  res.render('index');
	});

	router.get('/login', function(req, res, next) {
	  res.render('login');
	});

	router.post('/login', passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: 'login',
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

