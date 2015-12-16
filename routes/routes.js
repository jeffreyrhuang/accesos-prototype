var express = require('express');
var router = express.Router();
var passport = require('passport');

//import porton model
var Porton = require('../models/porton');


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

	router.get('/motor', verified, function(req, res, next) {
	  res.render('motor');
	});

	router.get('/acceso', verified, function(req, res, next) {
	  res.render('acceso');
	});

	router.get('/peso', verified, function(req, res, next) {
	  res.render('peso');
	});

	router.post('/peso-result', verified, function(req, res, next) {
		Porton.findOne({model: req.body.portonModel}, function(err, porton){
			if (err) {
				console.log(err);
			}
			var weight = porton.peso;
			console.log(weight + ' kg');
			console.log(req.body.alto + ' cm');
			console.log(req.body.ancho + ' cm');
			var pesoTotal = weight * req.body.alto * req.body.ancho;
			console.log(pesoTotal);
		});
		//res.redirect(303, '/peso');
	});

	router.get('/encuestas', verified, function(req, res, next) {
	  res.render('encuestas');
	});

	router.get('/cliente', verified, function(req, res, next) {
	  res.render('cliente');
	});

	return router;

};

