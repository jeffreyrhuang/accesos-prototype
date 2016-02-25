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

	router.get('/start', verified, function(req, res){
		res.render('start');
	});

	router.get('/create', function(req, res){
		res.render('create');
	});

	router.get('/home', verified, function(req, res) {
	  res.render('home');
	});

	router.get('/', function(req, res) {
	  res.render('index', {alertMessage: req.flash('loginMessage')});
	});

	router.post('/login', passport.authenticate('local-login', {
		successRedirect: '/start',
		failureRedirect: '/',
		failureFlash: true
	}));

	router.get('/signup', function(req, res) {
		res.render('signup', {alertMessage: req.flash('signupMessage')});
	});

	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/start',
		failureRedirect: '/signup',
		failureFlash: true 
	}));

	router.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});

	router.get('/motor', verified, function(req, res) {
	  res.render('motor');
	});

	router.get('/acceso', verified, function(req, res) {
	  res.render('acceso');
	});

	router.get('/peso', verified, function(req, res){
		res.render('peso');
	});

	router.post('/peso', verified, function(req, res) {
		if(req.xhr || req.accepts('json,html')==='json'){
			
			var portonQuery = Porton.findOne({model: req.body.portonModel}).exec();

			portonQuery.then(function(porton){
					var peso = porton.peso
					return peso;
				})
				.then(function(peso){
					res.json({success: true, alto: req.body.alto, ancho: req.body.ancho, peso: peso});
				})
				.catch(function(e){
					console.log(e);
				});

		} else {
			res.redirect(303, '/peso');
		}
	});


	router.get('/encuestas', verified, function(req, res) {
	  res.render('encuestas');
	});

	router.get('/cliente', verified, function(req, res) {
	  res.render('cliente');
	});

	return router;

};

