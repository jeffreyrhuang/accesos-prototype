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

	router.post('/login', passport.authenticate('local-login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash: true
	}));

	router.get('/signup', function(req, res, next) {
		res.render('signup', {alertMessage: req.flash('signupMessage')});
	});

	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
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
		function showTotal(pesoTotal) {
			res.render('peso-result', {nombre: req.body.proyecto, model: req.body.portonModel, alto: req.body.alto, ancho: req.body.ancho, pesocalc: pesoTotal});
		}
		//perhaps send to new peso-result page with option to undo changes. then have option to proceed to motors.
		//set up database for each project.  save pesoTotal to project in database. have it load on motor page.
		Porton.findOne({model: req.body.portonModel}, function(err, porton){
			if (err) {
				console.log(err);
			} else {
				var pesoTotal = porton.peso * req.body.alto * req.body.ancho;
				console.log('pesoTotal: ' + pesoTotal);
				showTotal(pesoTotal);
			}
			//Next steps:
			//store type of porton in DB on initial post
		});
		//res.redirect(303, '/peso', {pesocalc: pesoTotal};   !! redirect doesn't work !!
	});

	router.get('/encuestas', verified, function(req, res, next) {
	  res.render('encuestas');
	});

	router.get('/cliente', verified, function(req, res, next) {
	  res.render('cliente');
	});

	return router;

};

